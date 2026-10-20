// MRSUPER_PROMO_150MB_CHUNKED_V1
// Authenticated multipart uploads for promotional Videos only.
// Cloudflare receives 8 MiB requests; completed files live in the private R2 bucket.
import crypto from 'node:crypto';
import {requireAdmin} from './auth.js';
import {http} from './core.js';
import {r2Enabled,createPrivateVideoMultipart,sendPrivateVideoPart,finishPrivateVideoMultipart,abortPrivateVideoMultipart,headPrivateVideo} from './r2-storage.js';

const MiB=1024*1024;
export const PROMO_VIDEO_MAX_BYTES=150*MiB;
const PART_BYTES=8*MiB;
const TTL=6*60*60*1000;
const makeSignature=s=>crypto.createHmac('sha256',process.env.SESSION_SECRET).update(s).digest('base64url');
const fail=()=>{throw http(403,'Invalid or expired upload session. Start a new upload.');};
function sessionToken(info){const b=Buffer.from(JSON.stringify(info)).toString('base64url');return b+'.'+makeSignature(b)}
function decodeSession(token,actor){
  if(typeof token!=='string'||token.length>3000)fail();
  const pair=token.split('.');if(pair.length!==2||!pair[0]||!pair[1])fail();
  const a=Buffer.from(pair[1]),b=Buffer.from(makeSignature(pair[0]));
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))fail();
  let s;try{s=JSON.parse(Buffer.from(pair[0],'base64url').toString('utf8'))}catch{fail()}
  if(s.scope!=='promotional-video-v1'||String(s.actor)!==String(actor.id)||
     !Number.isSafeInteger(s.expires)||s.expires<Date.now()||
     !Number.isSafeInteger(s.size)||s.size<1||s.size>PROMO_VIDEO_MAX_BYTES||
     !['video/mp4','video/webm'].includes(s.mime)||
     !/^private\/videos\/[0-9a-f]{36}\.(mp4|webm)$/.test(s.key)||
     typeof s.upload_id!=='string'||s.upload_id.length<1||s.upload_id.length>500||
     s.part_count!==Math.ceil(s.size/PART_BYTES))fail();
  return s;
}
function expectedPartSize(s,number){return Math.min(PART_BYTES,s.size-(number-1)*PART_BYTES)}
function checkSignature(bytes,mime){
  if(mime==='video/mp4')return bytes.length>=8&&bytes.toString('ascii',4,8)==='ftyp';
  return bytes.length>=4&&bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
}
export async function verifiedShowcaseMultipart(token,actor){
  const s=decodeSession(token,actor);
  if(!r2Enabled)throw http(503,'R2 storage is required for large video uploads.');
  const head=await headPrivateVideo(s.key);
  if(!head||head.ContentLength!==s.size||head.ContentType!==s.mime)
    throw http(422,'The large video upload has not finished or failed verification.');
  return {key:s.key,size:s.size,mime:s.mime};
}
export function registerShowcaseChunkRoutes(app){
  app.post('/api/admin/video-chunks/start',async req=>{
    const actor=await requireAdmin(req);
    if(!r2Enabled)throw http(503,'Large video uploads require Cloudflare R2 configuration on Render.');
    const size=Number(req.body?.file_size),mime=String(req.body?.mime_type||'');
    if(!Number.isSafeInteger(size)||size<1||size>PROMO_VIDEO_MAX_BYTES)throw http(413,'Video must be 150 MB or smaller.');
    if(!['video/mp4','video/webm'].includes(mime))throw http(422,'Use MP4 or WebM video.');
    const key=`private/videos/${crypto.randomBytes(18).toString('hex')}.${mime==='video/mp4'?'mp4':'webm'}`;
    const uploadId=await createPrivateVideoMultipart(key,mime);
    const info={scope:'promotional-video-v1',actor:actor.id,key,size,mime,upload_id:uploadId,part_count:Math.ceil(size/PART_BYTES),expires:Date.now()+TTL};
    return {upload_token:sessionToken(info),part_size:PART_BYTES,part_count:info.part_count};
  });
  app.post('/api/admin/video-chunks/part',async req=>{
    const actor=await requireAdmin(req);
    const s=decodeSession(req.body?.upload_token,actor);
    const number=Number(req.body?.part_number);
    if(!Number.isSafeInteger(number)||number<1||number>s.part_count)throw http(422,'Invalid upload part number.');
    const file=req.body?.chunk;
    if(!file||typeof file.toBuffer!=='function')throw http(422,'A video chunk is required.');
    if(Number(req.headers['content-length']||0)>PART_BYTES+1024*1024)throw http(413,'Upload chunk is too large.');
    const bytes=await file.toBuffer();
    if(bytes.length!==expectedPartSize(s,number))throw http(422,'Video chunk size does not match the declared file.');
    if(number===1&&!checkSignature(bytes,s.mime))throw http(422,'Video file signature is invalid for the selected format.');
    const etag=await sendPrivateVideoPart(s.key,s.upload_id,number,bytes);
    if(typeof etag!=='string'||!etag)throw http(502,'Storage did not confirm video chunk.');
    return {part_number:number,etag};
  });
  app.post('/api/admin/video-chunks/finish',async req=>{
    const actor=await requireAdmin(req);
    const s=decodeSession(req.body?.upload_token,actor);
    const parts=req.body?.parts;
    if(!Array.isArray(parts)||parts.length!==s.part_count)throw http(422,'Some video chunks are missing.');
    const completeParts=parts.map((item,i)=>{
      if(Number(item?.part_number)!==i+1||typeof item?.etag!=='string'||
         !/^"?[a-fA-F0-9]{32}(?:-[0-9]+)?"?$/.test(item.etag))throw http(422,'Invalid video chunk receipt.');
      return {PartNumber:i+1,ETag:item.etag};
    });
    await finishPrivateVideoMultipart(s.key,s.upload_id,completeParts);
    const head=await headPrivateVideo(s.key);
    if(!head||head.ContentLength!==s.size||head.ContentType!==s.mime)
      throw http(422,'Completed video did not match the expected size or type.');
    return {message:'Large promotional video uploaded and verified.'};
  });
  app.post('/api/admin/video-chunks/abort',async req=>{
    const actor=await requireAdmin(req);
    const s=decodeSession(req.body?.upload_token,actor);
    await abortPrivateVideoMultipart(s.key,s.upload_id);
    return {message:'Unfinished upload cancelled.'};
  });
}
