import mysql from 'mysql2/promise';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import {mkdir, writeFile, readFile, stat} from 'node:fs/promises';
import {resolve, join, extname} from 'node:path';

export const pool=mysql.createPool({host:process.env.DB_HOST||'mysql',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'edustream',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'edustream',waitForConnections:true,connectionLimit:Number(process.env.DB_POOL_SIZE||8),queueLimit:50,connectTimeout:7000,enableKeepAlive:true,ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:true,ca:process.env.DB_SSL_CA||undefined}:undefined,decimalNumbers:true});
export const q=async (sql,params=[])=>{const [rows]=await pool.execute(sql,params);return rows;};
export const one=async(sql,params=[])=> (await q(sql,params))[0]||null;
export const date=()=>new Date();
export const token=()=>crypto.randomBytes(32).toString('hex');
export const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export const hmac=s=>crypto.createHmac('sha256',process.env.OTP_SECRET||process.env.SESSION_SECRET||'local-development-only').update(s).digest('hex');
export const secureEqual=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&crypto.timingSafeEqual(x,y)};
export const passwordHash=async password=>bcrypt.hash(password,12);
export const passwordCheck=async(pw,hash)=>bcrypt.compare(pw,hash);
export const cleanUser=u=>u&&Object.fromEntries(Object.entries(u).filter(([k])=>!['password','remember_token','email_verification_code','email_verification_attempts','email_verification_expires_at','email_verification_sent_at'].includes(k)));
export const http=(code,message)=>Object.assign(new Error(message),{statusCode:code});
export const requireFields=(b,fields)=>{for(const k of fields)if(b[k]===undefined||b[k]===null||String(b[k]).trim()==='')throw http(422,`${k} is required.`)};
export const bool=v=>v===true||v===1||v==='1'||v==='true'||v==='on';
export const str=v=>v===undefined||v===null?'':String(v);
export const safeInt=v=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<=0)throw http(422,'Invalid identifier.');return n};
export const slug=s=>str(s).toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').slice(0,200)||`item-${crypto.randomBytes(4).toString('hex')}`;
export const page=async(base,values=[],req,per=20)=>{let n=Math.max(1,Math.min(100000,Number(req.query.page)||1));per=Math.min(per,100);const [rows,total]=await Promise.all([q(`${base} LIMIT ${per} OFFSET ${((n-1)*per)}`,values),one(`SELECT COUNT(*) AS n FROM (${base.replace(/ORDER BY [\s\S]*$/i,'')}) x`,values)]);return{data:rows,current_page:n,per_page:per,total:total.n,last_page:Math.max(1,Math.ceil(total.n/per)),from:rows.length?(n-1)*per+1:null,to:rows.length?(n-1)*per+rows.length:null};};
const cache=new Map();
export const cached=async(key,ttl,run)=>{const t=Date.now(),old=cache.get(key);if(old&&old.until>t)return old.value;if(old?.promise)return old.promise;const promise=run();cache.set(key,{promise});try{const value=await promise;cache.set(key,{value,until:t+ttl});return value}catch(e){cache.delete(key);throw e}};
export const clearCache=()=>cache.clear();
export const fields={
 categories:['name_en','name_fa','slug','description_en','description_fa','image_path','is_active','display_order'],
 instructors:['name_en','name_fa','bio_en','bio_fa','specialization_en','specialization_fa','photo_path','social_links','is_active'],
 courses:['category_id','instructor_id','title_en','title_fa','slug','description_en','description_fa','thumbnail_path','price','currency','is_free','status','duration_minutes','is_featured','meta_title','meta_description','published_at','join_enabled','join_url','join_button_text'],
 videos:['category_id','course_id','course_section_id','title_en','title_fa','slug','description_en','description_fa','video_path','thumbnail_path','mime_type','file_size','duration_seconds','price','currency','is_free','is_preview','status','is_featured','display_order','meta_title','meta_description','published_at'],
 bank_accounts:['bank_name','account_holder_name','account_number','additional_information','is_active','display_order'],
 banners:['title_en','title_fa','subtitle_en','subtitle_fa','description_en','description_fa','image_path','video_path','button_text_en','button_text_fa','button_link','style','display_order','is_active'],
 homepage_sections:['key','type','title_en','title_fa','subtitle_en','subtitle_fa','content','style','display_order','is_active'],
 short_videos:['title_en','title_fa','description_en','description_fa','video_path','thumbnail_path','duration_seconds','display_order','is_active'],
 navigation_items:['location','label_en','label_fa','url','display_order','is_active'],
 support_tickets:['type','subject','status','priority']
};
const jsonFields=new Set(['style','content','social_links']);
const boolFields=new Set(['is_active','is_free','is_featured','is_preview','join_enabled']);
const numberFields=new Set(['price','duration_minutes','duration_seconds','display_order','file_size','category_id','instructor_id','course_id','course_section_id']);
export const prepared=(table,input,editing=false)=>{const out={};for(const key of fields[table]||[]){if(Object.hasOwn(input,key)){let val=input[key];if(val===''&&['instructor_id','course_id','course_section_id','category_id','join_url'].includes(key))val=null;if(boolFields.has(key))val=bool(val)?1:0;else if(numberFields.has(key)&&val!==null){val=Number(val);if(!Number.isFinite(val)||val<0)throw http(422,`${key} must be a valid number.`)}else if(jsonFields.has(key)&&val!==null)val=JSON.stringify(typeof val==='string'?JSON.parse(val):val);else if(val!==null&&typeof val==='string')val=val.trim();out[key]=val}}return out};
export const insert=async(table,data,conn=pool)=>{const keys=Object.keys(data);if(!keys.length)throw http(422,'Empty data.');const [result]=await conn.execute(`INSERT INTO ${table} (${keys.map(k=>`\`${k}\``).join(',')},created_at,updated_at) VALUES (${keys.map(()=>'?').join(',')},NOW(),NOW())`,keys.map(k=>data[k]===undefined?null:data[k]));return result.insertId};
export const update=async(table,id,data,conn=pool)=>{const keys=Object.keys(data);if(!keys.length)return;await conn.execute(`UPDATE ${table} SET ${keys.map(k=>`\`${k}\`=?`).join(',')},updated_at=NOW() WHERE id=?`,[...keys.map(k=>data[k]===undefined?null:data[k]),id]);};
export const mediaRoot=resolve(process.env.STORAGE_ROOT||'./storage');
export const saveUpload=async(file,sub='public/misc',max=8*1024*1024,allowed=['image/jpeg','image/png','image/webp'])=>{if(!file)throw http(422,'File required.');if(!allowed.includes(file.mimetype))throw http(422,'Unsupported file type.');const bytes=await file.toBuffer();if(bytes.length>max)throw http(413,'File exceeds limit.');const sig=bytes.subarray(0,12);const jpg=sig[0]===0xff&&sig[1]===0xd8, png=sig.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')), webp=sig.toString('ascii',8,12)==='WEBP',pdf=sig.toString('ascii',0,5)==='%PDF-',mp4=sig.toString('ascii',4,8)==='ftyp',webm=sig.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));if(!(jpg&&file.mimetype==='image/jpeg'||png&&file.mimetype==='image/png'||webp&&file.mimetype==='image/webp'||pdf&&file.mimetype==='application/pdf'||mp4&&file.mimetype==='video/mp4'||webm&&file.mimetype==='video/webm'))throw http(422,'File signature does not match file type.');const ext={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','application/pdf':'.pdf','video/mp4':'.mp4','video/webm':'.webm'}[file.mimetype];const name=crypto.randomBytes(18).toString('hex')+ext;const dir=join(mediaRoot,sub);await mkdir(dir,{recursive:true});await writeFile(join(dir,name),bytes,{flag:'wx'});return `${sub.replace(/^public\//,'')}/${name}`;};
const smtpSendMail=async(to,subject,text)=>{if(!process.env.SMTP_HOST)throw http(503,'Email service is not configured.');const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}:undefined});await transport.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to,subject,text});};
export const notify=async(userId,title,message,url='/dashboard',level='info',conn=pool)=>{await conn.execute(`INSERT INTO notifications(id,type,notifiable_type,notifiable_id,data,created_at,updated_at) VALUES(?, 'App\\\\Notifications\\\\PlatformNotification','App\\\\Models\\\\User',?,?,NOW(),NOW())`,[crypto.randomUUID(),userId,JSON.stringify({title,message,url,type:level})]);};
export const notifyAdmins=async(title,message,url)=>{const admins=await q("SELECT id FROM users WHERE is_admin=1 AND status='active'");await Promise.all(admins.map(u=>notify(u.id,title,message,url).catch(()=>{})))};

export const sendMail = async (to, subject, text) => {
  if (!process.env.BREVO_API_KEY) {
    return smtpSendMail(to, subject, text);
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    throw http(503, 'Brevo sender is not configured.');
  }

  let response;

  try {
    response = await fetch(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: {
            email: process.env.BREVO_SENDER_EMAIL,
            name: process.env.BREVO_SENDER_NAME || 'MrSuper'
          },
          to: [{ email: to }],
          subject,
          textContent: text
        }),
        signal: AbortSignal.timeout(12000)
      }
    );
  } catch {
    throw http(503, 'Email service temporarily unavailable.');
  }

  if (!response.ok) {
    console.error('Brevo HTTP status:', response.status);
    throw http(503, 'Email could not be sent.');
  }
};
