import 'dotenv/config';
import {pool,one,insert,update,passwordHash} from './core.js';
import {createInterface} from 'node:readline/promises';
const email=String(process.argv[2]||'').toLowerCase();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Usage: node src/create-admin.js admin@example.com');
const rl=createInterface({input:process.stdin,output:process.stdout});
try{
 const pw=await rl.question('Admin password (12+ chars; input visible, run privately): ');
 if(pw.length<12)throw new Error('Use a password at least 12 characters long.');
 const existing=await one('SELECT id,is_admin FROM users WHERE email=?',[email]);
 if(existing&&!existing.is_admin)throw new Error('An existing non-admin account uses this email. Refusing automatic promotion.');
 if(existing)await update('users',existing.id,{password:await passwordHash(pw),email_verified_at:new Date(),status:'active'});
 else await insert('users',{name:'MrSuper Administrator',email,password:await passwordHash(pw),is_admin:1,email_verified_at:new Date(),status:'active',locale:'en'});
 console.log('Admin account configured:',email);
}finally{rl.close();await pool.end()}
