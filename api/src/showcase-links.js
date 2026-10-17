// MRSUPER_TELEGRAM_PROMOS_V1: full promotional video is hosted on Telegram (not MrSuper).
import {q,one,http} from './core.js';

let ready;
export function ensureShowcaseLinks(){
  if(!ready){
    ready=(async()=>{
      // Never alter legacy Laravel/defaultdb or any unrelated database.
      const current=await one('SELECT DATABASE() AS name');
      if(current?.name!=='mrsuper_modern_test')throw http(503,'Full video links are not configured for this database.');
      await q(`CREATE TABLE IF NOT EXISTS showcase_video_links (
        video_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
        full_video_url VARCHAR(2048) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    })().catch(err=>{ready=null;throw err});
  }
  return ready;
}
export function cleanFullVideoUrl(input,{required=false}={}){
  const value=String(input??'').trim();
  if(!value){if(required)throw http(422,'A Telegram full-video link is required.');return ''}
  if(value.length>2048||/[\x00-\x1f\x7f]/.test(value))throw http(422,'Full-video link is too long or invalid.');
  let url;
  try{url=new URL(value)}catch{throw http(422,'Enter a valid full-video HTTPS URL.')}
  const host=url.hostname.toLowerCase();
  const isTelegram=['t.me','www.t.me','telegram.me','www.telegram.me'].includes(host);
  if(url.protocol!=='https:'||url.username||url.password||!isTelegram||url.pathname.length<=1){
    throw http(422,'Enter a Telegram video link such as https://t.me/channelname/123');
  }
  return url.href;
}
export async function readShowcaseLink(videoId){
  await ensureShowcaseLinks();
  const row=await one('SELECT full_video_url FROM showcase_video_links WHERE video_id=?',[videoId]);
  return row?.full_video_url||'';
}
