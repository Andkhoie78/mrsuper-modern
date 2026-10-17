// MRSUPER_TELEGRAM_PROMOS_V1: only published promotional clips with Telegram full-video links.
import {useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {PlayCircle} from 'lucide-react';
import {asset} from '../api/client';
import {publicGet,readPublicCache,writePublicCache} from '../api/publicData';
import {useSite} from '../context/SiteContext';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Seo from '../components/Seo';
const empty={data:[],current_page:1,last_page:1};
export default function VideosPage(){
  const[params,setParams]=useSearchParams();
  const[page,setPage]=useState(()=>readPublicCache('promo-videos:'+params.toString(),empty));
  const {localized}=useSite();
  const filters=Object.fromEntries(params.entries());
  useEffect(()=>{let live=true;const key='promo-videos:'+params.toString();setPage(readPublicCache(key,empty));publicGet('/public/videos',{params:filters}).then(r=>{if(live){setPage(r.data);writePublicCache(key,r.data)}}).catch(()=>{});return()=>{live=false}},[params.toString()]);
  function change(key,value){const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);next.delete('page');setParams(next)}
  return <div className="container-page py-10">
    <Seo title="Promotional Videos"/>
    <h1 className="text-3xl font-black">Promotional Videos</h1>
    <p className="mt-2 muted">Academy activities, scientific trips, and promotional videos. Watch a short clip here, then follow the Telegram link for the complete video.</p>
    <div className="card mt-6 flex flex-wrap gap-3 p-4"><input className="input flex-1" placeholder="Search videos" value={filters.q||''} onChange={e=>change('q',e.target.value)}/><select className="input" value={filters.sort||'newest'} onChange={e=>change('sort',e.target.value)}><option value="newest">Newest</option><option value="popular">Most popular</option></select></div>
    {page.data?.length?<div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{page.data.map(v=><Link key={v.id} to={`/videos/${v.slug}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-video overflow-hidden bg-slate-900">{v.thumbnail_path?<img src={asset(v.thumbnail_path)} alt="" loading="lazy" className="h-full w-full object-cover"/>:<div className="grid h-full w-full place-items-center text-white"><PlayCircle size={48}/></div>}<div className="absolute bottom-3 left-3 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-bold text-white">Watch preview</div></div><div className="p-4"><h2 className="font-extrabold group-hover:text-[var(--primary)]">{localized(v,'title')||v.title_en}</h2><p className="mt-2 line-clamp-3 text-sm muted">{localized(v,'description')||''}</p><p className="mt-3 text-sm font-semibold text-[var(--primary)]">View full video on Telegram ↗</p></div></Link>)}</div>:<div className="mt-8"><EmptyState title="No promotional videos yet"/></div>}
    <Pagination meta={page} onPage={number=>{const next=new URLSearchParams(params);next.set('page',number);setParams(next)}}/>
  </div>;
}
