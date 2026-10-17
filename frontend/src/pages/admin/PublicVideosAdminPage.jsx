// MRSUPER_TELEGRAM_PROMOS_V1: separate from homepage Short Videos and paid Course Lessons.
import {useEffect, useRef, useState} from 'react';
import {CheckCircle2, Film, Pencil, Plus, Trash2, ExternalLink} from 'lucide-react';
import {API_ORIGIN, api, asset, csrf, messageFrom} from '../../api/client';
import Modal from '../../components/Modal';

const empty = {name:'', description:'', telegram_url:'', video:null, thumbnail:null};
const allowedVideos = ['video/mp4','video/webm'];
const allowedImages = ['image/png','image/jpeg','image/webp'];
const VIDEO_MAX = 20*1024*1024;
const IMAGE_MAX = 8*1024*1024;
const telegramURL = input => {
  try {
    const u = new URL(String(input||'').trim());
    return u.protocol === 'https:' && !u.username && !u.password &&
      ['t.me','telegram.me','www.t.me','www.telegram.me'].includes(u.hostname.toLowerCase()) && u.pathname.length > 1;
  } catch {return false}
};
function SelectedPreview({file,kind}) {
  const [url,setUrl]=useState('');
  useEffect(()=>{if(!(file instanceof File)){setUrl('');return}const x=URL.createObjectURL(file);setUrl(x);return()=>URL.revokeObjectURL(x)},[file]);
  if(!url)return null;
  return kind==='video'
    ? <video src={url} controls preload="metadata" className="aspect-video w-full rounded-lg bg-black"/>
    : <img src={url} alt="Selected video cover" className="aspect-video w-full rounded-lg bg-slate-100 object-contain"/>;
}
function FilePreview({record,video,thumbnail}){
  const [vidError,setVidError]=useState(false);
  const [imgError,setImgError]=useState(false);
  useEffect(()=>{setVidError(false);setImgError(false)},[record?.id,video,thumbnail]);
  const stored = record?.id && record.has_video ? `${API_ORIGIN}/api/admin/videos/${record.id}/preview` : '';
  return <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
    <div><p className="mb-2 text-sm font-semibold">{video?'Selected preview':'Saved preview'}</p>
      {video?<SelectedPreview file={video} kind="video"/>:stored?<video src={stored} controls preload="metadata" controlsList="nodownload" className="aspect-video w-full rounded-lg bg-black" onError={()=>setVidError(true)}/>:<div className="grid aspect-video place-items-center rounded-lg bg-slate-100 text-sm muted">No preview yet</div>}
      {vidError&&<p role="alert" className="mt-2 text-sm text-red-600">Could not play the saved preview.</p>}
      {video&&<p className="mt-2 break-all text-xs muted">{video.name}</p>}
    </div>
    <div><p className="mb-2 text-sm font-semibold">{thumbnail?'Selected cover':'Saved cover (optional)'}</p>
      {thumbnail?<SelectedPreview file={thumbnail} kind="image"/>:record?.thumbnail_path&&!imgError?<img src={asset(record.thumbnail_path)} alt="Saved cover" className="aspect-video w-full rounded-lg bg-slate-100 object-contain" onError={()=>setImgError(true)}/>:<div className="grid aspect-video place-items-center rounded-lg bg-slate-100 text-sm muted">No cover yet</div>}
    </div>
  </div>;
}
export default function PublicVideosAdminPage(){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);
  const [current,setCurrent]=useState(null);
  const [form,setForm]=useState({...empty});
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(null);
  const [progress,setProgress]=useState(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const lock=useRef(false);
  async function reload(){const {data}=await api.get('/admin/showcase-videos');setRows(data.data||[])}
  useEffect(()=>{let alive=true;api.get('/admin/showcase-videos').then(({data})=>{if(alive)setRows(data.data||[])}).catch(e=>{if(alive)setError(messageFrom(e))}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[]);
  function add(){if(saving||deleting!==null)return;setCurrent(null);setForm({...empty});setProgress(null);setError('');setNotice('');setOpen(true)}
  async function edit(row){if(saving||deleting!==null)return;setError('');setNotice('');try{const {data}=await api.get(`/admin/showcase-videos/${row.id}`);setCurrent(data);setForm({name:data.title_fa||data.title_en||'',description:data.description_fa||data.description_en||'',telegram_url:data.full_video_url||'',video:null,thumbnail:null});setProgress(null);setOpen(true)}catch(e){setError(messageFrom(e))}}
  function change(key,value){setForm(f=>({...f,[key]:value}));setError('')}
  function close(){if(!saving)setOpen(false)}
  async function save(event){
    event.preventDefault();if(lock.current)return;lock.current=true;setError('');setNotice('');setProgress(null);
    let accepted=false;
    try {
      if(!form.name.trim())throw new Error('Write a video name.');
      if(!telegramURL(form.telegram_url))throw new Error('Add a valid Telegram video link, for example https://t.me/channelname/123');
      if(!current && !(form.video instanceof File))throw new Error('Choose a short MP4 or WebM promotional preview.');
      if(form.video && (!allowedVideos.includes(form.video.type)||form.video.size===0||form.video.size>VIDEO_MAX))throw new Error('Video preview must be MP4 or WebM, max 20 MB.');
      if(form.thumbnail && (!allowedImages.includes(form.thumbnail.type)||form.thumbnail.size===0||form.thumbnail.size>IMAGE_MAX))throw new Error('Cover must be JPG, PNG or WebP, max 8 MB.');
      setSaving(true);await csrf();
      const fd=new FormData();
      // Single name and description are used in both site languages to avoid an incomplete listing.
      fd.append('title_en',form.name.trim());fd.append('title_fa',form.name.trim());
      fd.append('description_en',form.description.trim());fd.append('description_fa',form.description.trim());
      fd.append('full_video_url',form.telegram_url.trim());
      fd.append('status','published');
      if(form.video)fd.append('video',form.video,form.video.name);
      if(form.thumbnail)fd.append('thumbnail',form.thumbnail,form.thumbnail.name);
      const {data:result}=await api.post(current?`/admin/showcase-videos/${current.id}`:'/admin/showcase-videos',fd,{onUploadProgress:e=>{if(e.total)setProgress(Math.min(100,Math.round(e.loaded/e.total*100)))}});
      accepted=true;
      const id=current?.id||result?.id;
      if(!id)throw new Error('Server accepted save but no ID returned; check the list before retrying.');
      const {data:verified}=await api.get(`/admin/showcase-videos/${id}`);
      if(verified.title_en!==form.name.trim()||verified.status!=='published'||!verified.has_video||verified.course_id!=null||!Boolean(verified.is_free)||verified.full_video_url!==new URL(form.telegram_url).href)throw new Error('Saved video could not be fully verified. Check the list before retrying.');
      await reload();setOpen(false);setNotice(`Promotional video ${current?'updated':'added'} successfully.`);
    }catch(e){setError(`${accepted?'Save may have succeeded. Check the list before retrying. ':''}${messageFrom(e)}`)}finally{setSaving(false);setProgress(null);lock.current=false}
  }
  async function remove(row){if(saving||deleting!==null)return;if(!window.confirm(`Delete promotional video "${row.title_en}"? Videos with payment history cannot be deleted.`))return;setError('');setNotice('');setDeleting(row.id);try{await csrf();await api.delete(`/admin/showcase-videos/${row.id}`);await reload();setNotice('Video deleted successfully.')}catch(e){setError(messageFrom(e))}finally{setDeleting(null)}}
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">Promotional Videos</h1><p className="mt-1 muted">Academy promotions, scientific trips, and activities. Add a short preview and a link to watch the complete video on Telegram. Completely free.</p></div><button type="button" className="btn-primary" disabled={saving||deleting!==null} onClick={add}><Plus size={17}/>Add Promotional Video</button></div>
    {notice&&<p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={16} className="mr-2 inline"/>{notice}</p>}
    {error&&!open&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="card mt-6 overflow-auto">{loading?<p className="p-5 muted">Loading...</p>:rows.length?<table className="admin-table"><thead><tr><th>Video</th><th>Telegram full video</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(v=><tr key={v.id}><td><div className="flex items-center gap-3">{v.thumbnail_path?<img src={asset(v.thumbnail_path)} alt="" className="h-12 w-20 rounded-lg bg-slate-100 object-cover"/>:<Film size={24} className="text-slate-400"/>}<span className="font-semibold">{v.title_fa||v.title_en}</span></div></td><td>{telegramURL(v.full_video_url)?<a href={v.full_video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 underline">Watch on Telegram <ExternalLink size={13}/></a>:<span className="text-amber-700">No Telegram link</span>}</td><td>{v.status==='published'?'Published':v.status}</td><td><div className="flex gap-2"><button type="button" className="rounded-lg p-2 hover:bg-blue-50" title="Edit video" onClick={()=>edit(v)} disabled={deleting!==null}><Pencil size={16}/></button><button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Delete video" disabled={deleting!==null} onClick={()=>remove(v)}>{deleting===v.id?'Deleting...':<Trash2 size={16}/>}</button></div></td></tr>)}</tbody></table>:<p className="p-6 text-sm muted">No promotional videos have been added yet.</p>}</div>
    <Modal open={open} wide title={current?'Edit Promotional Video':'Add Promotional Video'} onClose={close}>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <fieldset disabled={saving} className="contents">
          <label className="md:col-span-2"><span className="label">Video name</span><input className="input" value={form.name} maxLength={255} required onChange={e=>change('name',e.target.value)} placeholder="e.g. Scientific trip to Bamyan"/></label>
          <label className="md:col-span-2"><span className="label">Description</span><textarea className="input min-h-28" value={form.description} onChange={e=>change('description',e.target.value)} placeholder="A short explanation of this activity..."/></label>
          <label className="md:col-span-2"><span className="label">Full video link on Telegram</span><input type="url" className="input" required value={form.telegram_url} onChange={e=>change('telegram_url',e.target.value)} placeholder="https://t.me/channelname/123"/><span className="mt-1 block text-xs muted">Use a link to the full video post on Telegram. Viewers may need Telegram to open it.</span>{telegramURL(form.telegram_url)&&<a className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-700 underline" target="_blank" rel="noopener noreferrer" href={form.telegram_url}>Test Telegram link <ExternalLink size={12}/></a>}</label>
          <label><span className="label">Short promotional preview (MP4/WebM, max 20 MB){current?' · optional replacement':''}</span><input className="input" type="file" accept="video/mp4,video/webm" required={!current} onChange={e=>change('video',e.target.files?.[0]||null)}/></label>
          <label><span className="label">Cover image (optional, JPG/PNG/WebP)</span><input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>change('thumbnail',e.target.files?.[0]||null)}/></label>
          <FilePreview record={current} video={form.video} thumbnail={form.thumbnail}/>
        </fieldset>
        {error&&<p role="alert" className="md:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary md:col-span-2">{saving?`Saving...${progress===null?'':` ${progress}% uploaded`}`:current?'Save Changes':'Publish Promotional Video'}</button>
      </form>
    </Modal>
  </>;
}
