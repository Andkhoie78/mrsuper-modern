import 'dotenv/config';
import {pool,one,insert} from './core.js';
// Only use for a new local test database. Never seed production with fake recipient accounts.
if(process.env.DB_HOST!=='mysql'||process.env.NODE_ENV==='production'&&process.env.ALLOW_LOCAL_DEMO!=='true')throw new Error('Demo seeding is limited to explicit local development. Set ALLOW_LOCAL_DEMO=true only in Docker local.');
const categorySlug='demo-courses';
let category=await one('SELECT * FROM categories WHERE slug=?',[categorySlug]);
if(!category){const id=await insert('categories',{name_en:'Demo Courses',name_fa:'کورس‌های آزمایشی',slug:categorySlug,is_active:1,display_order:0});category={id}}
const courseSlug='mrsuper-demo-course';
if(!await one('SELECT id FROM courses WHERE slug=?',[courseSlug]))await insert('courses',{category_id:category.id,title_en:'MrSuper Demo Course',title_fa:'کورس آزمایشی MrSuper',slug:courseSlug,description_en:'Test manual HesabPay payment; do not transfer real money.',price:100,currency:'AFN',is_free:0,status:'published',is_featured:1,join_enabled:1,join_url:'https://t.me/mrsuper_demo_example',join_button_text:'Join',published_at:new Date()});
if(!await one("SELECT id FROM bank_accounts WHERE bank_name='HesabPay DEMO'"))await insert('bank_accounts',{bank_name:'HesabPay DEMO',account_holder_name:'Demo Only — Do Not Transfer',account_number:'TEST-NOT-REAL',additional_information:'TEST ONLY: no real funds',is_active:1,display_order:0});
console.log('Local demo: /courses/mrsuper-demo-course (100 AFN, no real transfer)');
await pool.end();
