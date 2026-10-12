// After Docker local setup and demo seed:
// node tests/smoke.mjs
// TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD optional for admin approval test.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const host=process.env.TEST_URL||'http://localhost:8089';
const email=`smoketest-${Date.now()}@mrsuper.local`,pw='LocalSmokePass123!';
function agent(){const cookies=new Map();return async (path,method='GET',data)=>{
 const h={},cookie=[...cookies.entries()].map(([k,v])=>`${k}=${v}`).join('; ');if(cookie)h.Cookie=cookie;
 if(method!=='GET'&&method!=='HEAD'){h['X-XSRF-TOKEN']=decodeURIComponent(cookies.get('XSRF-TOKEN')||'')}
 let body;if(data instanceof FormData){body=data}else if(data!==undefined){h['Content-Type']='application/json';body=JSON.stringify(data)}
 const r=await fetch(host+path,{method,headers:h,body,redirect:'manual'});
 for(const x of r.headers.getSetCookie?.()||[]){const first=x.split(';')[0],at=first.indexOf('=');if(at>0)cookies.set(first.slice(0,at),first.slice(at+1))}
 const response=r.status===204?{}:await r.json().catch(()=>({}));return {status:r.status,data:response};
}}
const student=agent();
assert.equal((await student('/up')).status,200);
assert.equal((await student('/api/public/courses')).status,200);
await student('/sanctum/csrf-cookie');
let r=await student('/api/auth/register','POST',{name:'Smoke Test',email,password:pw,password_confirmation:pw,locale:'en'});
assert.equal(r.status,201,JSON.stringify(r.data));
const box=await fetch('http://localhost:8025/api/v1/messages').then(r=>r.json());
const msg=(box.messages||box.Messages||[]).find(m=>(m.To||m.to||[]).some?.(x=>(x.Address||x.address)===email));
assert.ok(msg,'Local Mailpit must receive registration mail.');
const letter=await fetch(`http://localhost:8025/api/v1/message/${msg.ID||msg.id}`).then(r=>r.json());
const otp=JSON.stringify(letter).match(/\b[0-9]{6}\b/)?.[0];assert.ok(otp,'Mailpit message must contain OTP');
r=await student('/api/auth/verify-otp','POST',{email,code:otp});assert.equal(r.status,200,JSON.stringify(r.data));
const c=await student('/api/public/courses/mrsuper-demo-course');assert.equal(c.status,200,JSON.stringify(c.data));
assert.equal(c.data.has_access,false);assert.equal(c.data.join_url,undefined,'Private Telegram link exposed before payment!');
const quote=await student(`/api/user/payments/quote/course/${c.data.id}`);assert.equal(quote.status,200);assert.ok(quote.data.bank_accounts.length);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlJGpkAAAAASUVORK5CYII=','base64');
const form=new FormData();for(const [key,value] of Object.entries({content_type:'course',content_id:String(c.data.id),bank_account_id:String(quote.data.bank_accounts[0].id),transaction_information:'Local test - no money sent',transaction_reference:'SMOKE-'+Date.now()}))form.append(key,value);form.append('receipt',new Blob([png],{type:'image/png'}),'sample.png');
r=await student('/api/user/payments','POST',form);assert.equal(r.status,201,JSON.stringify(r.data));assert.equal(r.data.payment.status,'pending');
if(process.env.TEST_ADMIN_EMAIL&&process.env.TEST_ADMIN_PASSWORD){const admin=agent();await admin('/sanctum/csrf-cookie');const login=await admin('/api/auth/login','POST',{email:process.env.TEST_ADMIN_EMAIL,password:process.env.TEST_ADMIN_PASSWORD});assert.equal(login.status,200);r=await admin(`/api/admin/payments/${r.data.payment.id}/approve`,'POST',{});assert.equal(r.status,200,JSON.stringify(r.data));const after=await student('/api/public/courses/mrsuper-demo-course');assert.equal(after.data.has_access,true);assert.ok(after.data.join_url?.startsWith('https://t.me/'));}
console.log('PASS: public pages, registration OTP, user session, paid course gate, manual receipt, pending record.');
