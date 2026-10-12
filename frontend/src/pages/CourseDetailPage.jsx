import {useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {Clock,PlayCircle,ShieldCheck,UserRound} from 'lucide-react';
import {api,asset} from '../api/client';
import Loading from '../components/Loading';
import Seo from '../components/Seo';
import {useAuth} from '../context/AuthContext';
import {useSite} from '../context/SiteContext';

export default function CourseDetailPage(){
  const {slug}=useParams();
  const {user}=useAuth();
  const {localized}=useSite();
  const nav=useNavigate();
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    let alive=true;
    setData(null);setError('');
    api.get('/public/courses/'+slug).then(r=>{if(alive)setData(r.data)}).catch(()=>{if(alive)setError('Unable to load course.')});
    return()=>{alive=false};
  },[slug,user?.id]);
  useEffect(()=>{
    if(!user)return;
    let last=0;
    const refresh=()=>{
      if(document.visibilityState!=='visible'||Date.now()-last<5000)return;
      last=Date.now();
      api.get('/public/courses/'+slug).then(r=>setData(r.data)).catch(()=>{});
    };
    window.addEventListener('focus',refresh);
    return()=>window.removeEventListener('focus',refresh);
  },[slug,user?.id]);
  if(error)return <div className="container-page py-16 text-red-600">{error}</div>;
  if(!data)return <Loading/>;
  const startPayment=()=>{
    if(!user){nav('/login?next='+encodeURIComponent('/courses/'+slug));return;}
    nav('/dashboard/payments/new?type=course&id='+encodeURIComponent(data.id));
  };
  const join=!!(data.join_enabled&&data.join_url&&(data.is_free||data.has_access));
  const pending=!data.has_access&&data.payment_status==='pending';
  return <div className="container-page py-10">
    <Seo title={data.meta_title||localized(data,'title')} description={data.meta_description||localized(data,'description')}/>
    <div className="grid gap-8 lg:grid-cols-[1.5fr_.75fr]">
      <div>
        <div className="text-sm font-bold text-[var(--primary)]">{localized(data.category,'name')}</div>
        <h1 className="mt-2 text-4xl font-black">{localized(data,'title')}</h1>
        <p className="mt-4 max-w-3xl leading-7 muted">{localized(data,'description')}</p>
        <div className="mt-5 flex flex-wrap gap-5 text-sm muted">
          <span className="flex items-center gap-1"><Clock size={17}/>{data.duration_minutes} minutes</span>
          {data.instructor&&<span className="flex items-center gap-1"><UserRound size={17}/>{localized(data.instructor,'name')}</span>}
          <span>{data.views} views</span>
        </div>
        <div className="mt-8"><h2 className="section-title">Course Content</h2><div className="mt-4 grid gap-3">
          {data.sections?.map((s,i)=><div className="card overflow-hidden" key={s.id}>
            <div className="bg-slate-50 px-5 py-4 font-extrabold">{i+1}. {localized(s,'title')}</div>
            <div>{s.videos?.map(v=><Link to={'/videos/'+v.slug} key={v.id} className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-sm hover:bg-slate-50">
              <span className="flex items-center gap-2"><PlayCircle size={16}/>{localized(v,'title')}</span>
              <span className="muted">{v.is_preview||v.is_free?'Preview / Free':Math.round(v.duration_seconds/60)+' min'}</span>
            </Link>)}</div>
          </div>)}</div></div>
      </div>
      <aside><div className="card sticky top-24 overflow-hidden">
        <div className="aspect-video bg-slate-100">{data.thumbnail_path?<img src={asset(data.thumbnail_path)} alt={data.title_en} className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center bg-blue-950 text-white"><PlayCircle size={60}/></div>}</div>
        <div className="p-5">
          <div className="text-2xl font-black">{data.is_free?'Free':data.price+' '+data.currency}</div>
          {join?<a href={data.join_url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 w-full">{data.join_button_text||'Join Course'}</a>
            :data.is_free?<Link to={data.sections?.[0]?.videos?.[0]?'/videos/'+data.sections[0].videos[0].slug:'/videos'} className="btn-primary mt-4 w-full">Start Learning</Link>
            :data.has_access?<p className="mt-4 rounded-lg bg-green-50 p-3 text-green-700">Payment approved. Access granted. Join link is not enabled yet; contact the administrator.</p>
            :pending?<div className="mt-4 rounded-lg bg-amber-50 p-4 text-amber-900"><b>Pending Admin Approval</b><p className="mt-1 text-sm">Your receipt was submitted. Join becomes available only after the administrator verifies the transfer.</p><Link to="/dashboard/payments" className="mt-2 inline-block text-sm font-semibold underline">View payment status</Link></div>
            :<button onClick={startPayment} className="btn-primary mt-4 w-full">Pay with HesabPay</button>}
          {data.payment_status==='rejected'&&!data.has_access&&<p className="mt-3 text-sm text-red-600">Previous payment was rejected. You may submit a new receipt.</p>}
          <p className="mt-4 flex gap-2 text-xs leading-5 muted"><ShieldCheck size={17} className="shrink-0"/>{data.is_free?'Free course access is available.':'Pay via HesabPay, upload your receipt, and wait for manual Admin approval before joining.'}</p>
        </div>
      </div></aside>
    </div>
  </div>;
}
