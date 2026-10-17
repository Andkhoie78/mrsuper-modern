import {useEffect,useMemo,useState} from 'react';import {Link,useNavigate} from 'react-router-dom';import {ArrowLeft,ArrowRight,BookOpen,PlayCircle,Search,ShieldCheck} from 'lucide-react';import {asset} from '../api/client';import {publicGet,readPublicCache,writePublicCache} from '../api/publicData';import ContentCard from '../components/ContentCard';import Seo from '../components/Seo';import {useSite} from '../context/SiteContext';
function Section({title,link,children,style}){return <section className="py-7" style={{background:style?.background_color||undefined,color:style?.text_color||undefined}}><div className="container-page"><div className="mb-4 flex items-center justify-between"><h2 className="section-title" style={{color:style?.title_color||undefined}}>{title}</h2>{link&&<Link className="text-sm font-bold text-[var(--primary)]" to={link}>View all →</Link>}</div>{children}</div></section>}
// MR_SUPER_BANNER_DISPLAY_FIX_V1: responsive banner image/video, editable subtitle, and video fallback.
// MRSUPER_BANNER_MEDIA_BACKGROUND_V3: full-bleed image/video backgrounds for real CMS banner media.
function Hero({banners,locale,siteDescription}) {
  const [index,setIndex]=useState(0);
  const [failedVideo,setFailedVideo]=useState('');
  useEffect(()=>{
    if (banners.length < 2) return;
    const timer=setInterval(()=>setIndex(i=>(i+1)%banners.length),7000);
    return ()=>clearInterval(timer);
  },[banners.length]);
  const b=banners[index%banners.length]||{};
  const s=b.style&&typeof b.style==='object'&&!Array.isArray(b.style)?b.style:{};
  const gradient=s.gradient_from&&s.gradient_to
    ? 'linear-gradient(135deg,'+s.gradient_from+','+s.gradient_to+')'
    : s.background;
  const title=(locale==='fa'&&b.title_fa)||b.title_en||'Learn skills online, at your own pace.';
  const description=(locale==='fa'&&b.description_fa)||b.description_en||siteDescription||'Watch free videos or purchase complete courses and premium educational videos.';
  const subtitle=(locale==='fa'&&b.subtitle_fa)||b.subtitle_en||'Free & paid educational content';
  const buttonText=(locale==='fa'&&b.button_text_fa)||b.button_text_en||'Explore';
  const imagePath=typeof b.image_path==='string'?b.image_path.trim():'';
  const videoPath=typeof b.video_path==='string'?b.video_path.trim():'';
  const videoWorks=Boolean(videoPath&&failedVideo!==videoPath);
  const hasMedia=Boolean(videoWorks||imagePath);
  return <section className="relative isolate overflow-hidden text-white" style={{background:gradient||'linear-gradient(135deg,#071a3e 0%,#0b2c63 60%,#0f3a80 100%)'}}>
    {/* The uploaded file is an actual background; the colors are only fallback. */}
    {videoWorks
      ? <video key={videoPath} src={asset(videoPath)} poster={imagePath?asset(imagePath):undefined} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" onError={()=>setFailedVideo(videoPath)} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      : imagePath
        ? <img key={imagePath} src={asset(imagePath)} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover" loading="eager" />
        : null}
    {hasMedia&&<div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{background:'linear-gradient(90deg,rgba(4,15,38,0.90) 0%,rgba(4,15,38,0.73) 50%,rgba(4,15,38,0.27) 100%)'}} />}
    <div className="container-page relative z-10 grid min-h-[430px] items-center lg:grid-cols-2">
      <div className="flex flex-col justify-center py-12 lg:py-16 lg:pr-10">
        <span className="badge w-fit bg-black/30 text-blue-100"><ShieldCheck size={14} className="mr-1"/>{subtitle}</span>
        <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight drop-shadow-lg md:text-6xl" style={{color:s.title_color||undefined}}>{title}</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white drop-shadow-md" style={{color:s.text_color||undefined}}>{description}</p>
        {b.button_link&&<Link to={b.button_link} className="btn-primary mt-6 w-fit" style={{background:s.button_color||undefined,color:s.button_text_color||undefined}}>{buttonText}<ArrowRight size={17}/></Link>}
      </div>
      <div className="hidden lg:block" aria-hidden="true" />
    </div>
    {banners.length>1&&<div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-3 py-2 backdrop-blur">
      <button type="button" aria-label="Previous banner" onClick={()=>{setFailedVideo('');setIndex((index-1+banners.length)%banners.length)}}><ArrowLeft size={16}/></button>
      {banners.map((_,i)=><button key={i} type="button" aria-label={'Banner '+(i+1)} onClick={()=>{setFailedVideo('');setIndex(i)}} className={'h-2 rounded-full transition-all '+(i===index?'w-6 bg-white':'w-2 bg-white/50')}/>)}
      <button type="button" aria-label="Next banner" onClick={()=>{setFailedVideo('');setIndex((index+1)%banners.length)}}><ArrowRight size={16}/></button>
    </div>}
  </section>;
}
const emptyHome={banners:[],categories:[],featured_courses:[],free_videos:[],paid_videos:[],featured_videos:[],short_videos:[],sections:[]};export default function HomePage(){const[data,setData]=useState(()=>readPublicCache('home',emptyHome));const[q,setQ]=useState('');const nav=useNavigate();const{config,locale}=useSite();useEffect(()=>{publicGet('/public/home').then(r=>{setData(r.data);writePublicCache('home',r.data)}).catch(()=>{})},[]);const sections=data.sections?.length?data.sections:[{key:'featured_categories',type:'categories',title_en:'Featured Categories'},{key:'featured_courses',type:'courses',title_en:'Featured Courses'},{key:'free_videos',type:'videos',title_en:'Free Videos',content:{access:'free'}},{key:'paid_videos',type:'videos',title_en:'Paid Videos',content:{access:'paid'}},{key:'short_videos',type:'short_videos',title_en:'Short Promotional Videos'}];const title=s=>(locale==='fa'&&s.title_fa)||s.title_en||'';const render=s=>{const access=s.content?.access;if(s.type==='categories'||s.key==='featured_categories')return <Section key={s.id||s.key} title={title(s)} link="/categories" style={s.style}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{data.categories.map(c=><Link key={c.id} to={`/courses?category=${c.slug}`} className="card p-4 text-center hover:border-blue-300"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-[var(--primary)]"><BookOpen size={20}/></div><div className="mt-3 font-bold">{locale==='fa'&&c.name_fa?c.name_fa:c.name_en}</div></Link>)}</div></Section>;if(s.type==='courses'||s.key==='featured_courses')return <Section key={s.id||s.key} title={title(s)} link="/courses" style={s.style}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.featured_courses.map(x=><ContentCard key={x.id} item={x} type="course"/>)}</div></Section>;if(s.type==='videos'){const arr=access==='free'?data.free_videos:access==='paid'?data.paid_videos:data.featured_videos;const link=access?`/videos?access=${access}`:'/videos';if(!arr.length)return null;return <Section key={s.id||s.key} title={title(s)} link={link} style={s.style}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{arr.map(x=><ContentCard key={x.id} item={x} type="video"/>)}</div></Section>}if(s.type==='short_videos'||s.key==='short_videos')return data.short_videos?.length?<Section key={s.id||s.key} title={title(s)} style={s.style}><div className="grid gap-4 md:grid-cols-3">{data.short_videos.slice(0,6).map(v=><div className="card overflow-hidden" key={v.id}><video className="aspect-video w-full bg-black object-cover" src={v.video_url} poster={v.thumbnail_url} controls controlsList="nodownload"/><div className="p-3 font-bold">{locale==='fa'&&v.title_fa?v.title_fa:v.title_en}</div></div>)}</div></Section>:null;if(s.type==='custom')return <Section key={s.id||s.key} title={title(s)} style={s.style}><div className="card grid gap-6 overflow-hidden p-6 md:grid-cols-2"><div><p className="leading-7 muted">{s.content?.body||s.subtitle_en}</p>{s.content?.button_link&&<Link className="btn-primary mt-5" to={s.content.button_link}>{s.content.button_text||'Learn more'}</Link>}</div>{s.content?.image_path&&<img src={asset(s.content.image_path)} className="max-h-72 w-full rounded-xl object-cover"/>}</div></Section>;return null};return <><Seo/><Hero banners={data.banners||[]} locale={locale} siteDescription={config.settings?.site_description}/><section className="border-b bg-white"><div className="container-page py-7"><form className="mx-auto flex max-w-3xl gap-2 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-lg" onSubmit={e=>{e.preventDefault();if(q.trim())nav(`/courses?q=${encodeURIComponent(q)}`)}}><Search className="ml-2 self-center text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses and videos..." className="min-w-0 flex-1 px-2 outline-none"/><button className="btn-primary">Search</button></form></div></section>{sections.map(render)}</>}
