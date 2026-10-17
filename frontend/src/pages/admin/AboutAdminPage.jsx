// MRSUPER_ABOUT_EDITABLE_V1: every About field is optional and independent from global branding/payment settings.
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {CheckCircle2, ImagePlus} from 'lucide-react';
import {api, asset, csrf, messageFrom} from '../../api/client';
import {useSite} from '../../context/SiteContext';

const sections = [
  {heading:'Website / Academy', description:'Introduce the academy, its history and educational mission.', fields:[
    ['intro','Short website introduction','textarea'], ['story','Academy story / history','textarea'],
    ['mission','Mission','textarea'], ['vision','Vision','textarea']]},
  {heading:'Owner / Founder', description:'Introduce the owner or founder. Leave any field blank to hide it.', fields:[
    ['owner_name','Owner / founder name','input'], ['owner_role','Position / title','input'],
    ['owner_bio','Biography','textarea'], ['owner_achievements','Owner achievements — one per line','textarea']]},
  {heading:'Academy Achievements', description:'Enter one real achievement on each line. Empty lines will be ignored.', fields:[
    ['achievements','Academy achievements — one per line','textarea']]},
];
const keys = sections.flatMap(section => section.fields.flatMap(([id]) => [`about_${id}_en`, `about_${id}_fa`]));
const imageItems = [
  {key:'about_founder_photo_path', title:'Owner / Founder Photo', description:'Optional portrait of the owner or founder.'},
  {key:'about_academy_photo_path', title:'Academy Photo', description:'Optional photo of the academy, activities, or learning center.'}
];
const maxChars = name => name.endsWith('achievements') ? 4000 : name.endsWith('intro') || name.endsWith('story') || name.endsWith('mission') || name.endsWith('vision') || name.endsWith('bio') ? 6000 : 250;
const safeText = v => typeof v === 'string' || typeof v === 'number' ? String(v) : '';

function PhotoUpload({item, current, onSaved}) {
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    if (!selected) {setPreview(''); return}
    const url = URL.createObjectURL(selected);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selected]);
  async function upload() {
    setError(''); setSuccess('');
    if (!(selected instanceof File)) {setError('Choose an image first.'); return}
    if (!['image/png','image/jpeg','image/webp'].includes(selected.type) || !selected.size || selected.size > 8 * 1024 * 1024) {
      setError('Choose JPG, PNG or WebP up to 8 MB.'); return;
    }
    setBusy(true);
    try {
      await csrf();
      const data = new FormData(); data.append('key', item.key); data.append('file', selected, selected.name);
      const {data:result} = await api.post('/admin/cms/settings/assets', data);
      if (!result?.path) throw new Error('The server returned no saved image path.');
      const {data: rows} = await api.get('/admin/cms/settings');
      if (rows.find(row => row.key === item.key)?.value !== result.path) throw new Error('The uploaded photo could not be confirmed in settings.');
      onSaved(item.key, result.path); setSelected(null); setSuccess('Photo uploaded and saved.');
    } catch(e) {setError(messageFrom(e))} finally {setBusy(false)}
  }
  async function remove() {
    if (busy || !current || !window.confirm(`Remove the ${item.title} from the About page?`)) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await csrf();
      await api.put('/admin/cms/settings',{settings:{[item.key]:''},group:'about'});
      const {data:rows} = await api.get('/admin/cms/settings');
      if (rows.find(row => row.key === item.key)?.value !== '') throw new Error('Removal could not be verified.');
      onSaved(item.key, ''); setSuccess('Photo hidden from the About page. The original file was not deleted.');
    } catch(e) {setError(messageFrom(e))} finally {setBusy(false)}
  }
  return <div className="card p-5">
    <h3 className="flex items-center gap-2 font-extrabold"><ImagePlus size={19}/>{item.title} <span className="text-xs font-normal muted">(Optional)</span></h3>
    <p className="mt-2 text-sm muted">{item.description}</p>
    <div className="mt-4 grid min-h-40 place-items-center overflow-hidden rounded-xl bg-slate-50 p-3">
      {(preview || current) ? <img src={preview || asset(current)} alt={item.title} className="max-h-64 max-w-full rounded-lg object-contain"/> : <span className="text-sm muted">No photo selected</span>}
    </div>
    <label className="mt-4 block"><span className="label">Image (JPG, PNG, WebP; max 8 MB)</span><input className="input" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{setSelected(e.target.files?.[0]||null);setError('');setSuccess('')}}/></label>
    <div className="mt-3 flex flex-wrap gap-3"><button type="button" className="btn-primary" disabled={busy || !selected} onClick={upload}>{busy ? 'Saving...' : 'Upload Photo'}</button>{Boolean(current) && <button type="button" className="rounded-xl border px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50" disabled={busy} onClick={remove}>Hide Photo</button>}</div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {success && <p role="status" className="mt-3 text-sm text-green-700">{success}</p>}
  </div>;
}

export default function AboutAdminPage() {
  const [form, setForm] = useState({});
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {refresh} = useSite();
  useEffect(() => {
    let live = true;
    api.get('/admin/cms/settings').then(({data}) => {
      if (!live) return;
      const stored = Object.fromEntries(data.map(row => [row.key, row.value]));
      setForm(Object.fromEntries(keys.map(k => [k, safeText(stored[k])])));
      setPhotos(Object.fromEntries(imageItems.map(({key}) => [key, safeText(stored[key])])));
    }).catch(e => {if(live)setError(messageFrom(e))}).finally(() => {if(live)setLoading(false)});
    return () => {live = false};
  }, []);
  async function save(e) {
    e.preventDefault(); if (saving) return;
    setError(''); setSuccess(''); setSaving(true);
    const settings = Object.fromEntries(keys.map(k => [k, safeText(form[k]).trim()]));
    try {
      await csrf();
      await api.put('/admin/cms/settings',{settings,group:'about'});
      const {data:rows} = await api.get('/admin/cms/settings');
      const stored = Object.fromEntries(rows.map(row => [row.key, row.value]));
      if (!Object.entries(settings).every(([key,v]) => safeText(stored[key]) === v)) throw new Error('The server accepted the changes, but some About fields could not be verified. Check again before retrying.');
      setSuccess('About content saved and verified. Empty fields will be hidden from the public page.');
      refresh().catch(()=>{});
    } catch(e) {setError(messageFrom(e))} finally {setSaving(false)}
  }
  function imageSaved(key,value) {setPhotos(prev => ({...prev,[key]:value}));refresh().catch(()=>{})}
  return <>
    <h1 className="text-2xl font-black">About Page Manager</h1>
    <p className="mt-2 muted">Manage the About Us page in English and Dari. <strong>All fields and photos are optional.</strong> Blank sections are hidden automatically.</p>
    <p className="mt-2 text-sm"><Link className="font-bold text-blue-700 underline" to="/about" target="_blank" rel="noopener noreferrer">Preview public About page</Link></p>
    {loading ? <p className="mt-8 muted">Loading About information...</p> : <>
      <form onSubmit={save} className="mt-6 grid gap-6">
        {sections.map(section => <section key={section.heading} className="card p-5 md:p-7">
          <h2 className="text-xl font-extrabold">{section.heading}</h2><p className="mt-1 text-sm muted">{section.description}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">{section.fields.map(([id,label,control]) => <div key={id} className="md:col-span-2">
            <h3 className="mb-3 font-bold">{label} <span className="text-xs font-normal muted">(Optional)</span></h3>
            <div className="grid gap-4 md:grid-cols-2">{[['en','English'],['fa','Dari / فارسی']].map(([lang,name]) => {
              const key=`about_${id}_${lang}`;const props={className:'input w-full',disabled:saving,value:form[key]||'',maxLength:maxChars(id),onChange:e=>{setSuccess('');setForm(prev=>({...prev,[key]:e.target.value}))}};
              return <label key={key}><span className="label">{name}</span>{control === 'textarea' ? <textarea {...props} rows={id.includes('achievements') ? 5 : 4} placeholder={id.includes('achievements') ? 'One achievement on each line' : ''}/> : <input type="text" {...props}/>}</label>;
            })}</div>
          </div>)}</div>
        </section>)}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {success && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-700"><CheckCircle2 size={17} className="mr-2 inline"/>{success}</p>}
        <button className="btn-primary max-w-sm disabled:opacity-50" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save About Information'}</button>
      </form>
      <section className="mt-8"><h2 className="mb-4 text-xl font-extrabold">Optional Photos</h2><div className="grid gap-5 lg:grid-cols-2">{imageItems.map(item => <PhotoUpload key={item.key} item={item} current={photos[item.key]||''} onSaved={imageSaved}/>)}</div></section>
    </>}
  </>;
}
