// MRSUPER_VIDEO_ADMIN_FIX_V1: secure previews, verified saves, and safe video management.
import {useEffect, useRef, useState} from 'react';
import {Pencil, Plus, Trash2, Film, CheckCircle2} from 'lucide-react';
import {API_ORIGIN, api, asset, csrf, messageFrom} from '../../api/client';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

const initialForm = {
  category_id: '', course_id: '', course_section_id: '', title_en: '', title_fa: '',
  slug: '', description_en: '', description_fa: '', duration_seconds: 0,
  price: 0, currency: 'AFN', is_free: false, is_preview: false, status: 'draft',
  is_featured: false, display_order: 0, meta_title: '', meta_description: '',
  video: null, thumbnail: null
};
const allowedVideo = ['video/mp4', 'video/webm'];
const allowedThumbnail = ['image/jpeg', 'image/png', 'image/webp'];
const videoLimit = 60 * 1024 * 1024;
const imageLimit = 8 * 1024 * 1024;
const formFields = [
  'category_id', 'course_id', 'course_section_id', 'title_en', 'title_fa', 'slug',
  'description_en', 'description_fa', 'duration_seconds', 'price', 'currency',
  'is_free', 'is_preview', 'status', 'is_featured', 'display_order', 'meta_title', 'meta_description'
];

function useFilePreview(file) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!(file instanceof File)) {setUrl(''); return;}
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}
function validateFile(file, types, max, label) {
  if (!file) return '';
  if (!types.includes(file.type)) return `${label}: unsupported format.`;
  if (file.size === 0 || file.size > max) return `${label}: invalid file size (max ${Math.round(max / 1024 / 1024)} MB).`;
  return '';
}
function VideoStoredPreview({video, selectedVideo, selectedThumbnail}) {
  const videoUrl = useFilePreview(selectedVideo);
  const imageUrl = useFilePreview(selectedThumbnail);
  const [playbackError, setPlaybackError] = useState(false);
  const [imageError, setImageError] = useState(false);
  useEffect(() => {setPlaybackError(false)}, [video?.id, videoUrl]);
  useEffect(() => {setImageError(false)}, [video?.thumbnail_path, imageUrl]);
  const src = videoUrl || (video?.id && video?.has_video ? `${API_ORIGIN}/api/admin/videos/${video.id}/preview` : '');
  const thumb = imageUrl || (video?.thumbnail_path ? asset(video.thumbnail_path) : '');
  return <div className="md:col-span-2 rounded-xl border border-[var(--border)] p-4">
    <h3 className="font-bold">Current files &amp; selected replacements</h3>
    <p className="mt-1 text-xs muted">The saved video is private. Only an authenticated Admin can play it here.</p>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div>
        <div className="mb-2 text-sm font-semibold">Video {selectedVideo ? '(new selection)' : '(saved)'}</div>
        {src ? <video key={src} src={src} controls preload="metadata" controlsList="nodownload" className="aspect-video w-full rounded-lg bg-black" onError={() => setPlaybackError(true)} /> : <div className="grid aspect-video place-items-center rounded-lg bg-slate-100 text-sm muted">No video selected yet</div>}
        {playbackError && <p role="alert" className="mt-2 text-xs text-red-600">Video preview is unavailable. The private file or session may need checking.</p>}
        {selectedVideo && <p className="mt-1 break-all text-xs muted">Selected: {selectedVideo.name}</p>}
        {!selectedVideo && video?.has_video && <p className="mt-1 text-xs muted">Stored file · {video.mime_type || 'video'} · {video.file_size ? `${(video.file_size / 1024 / 1024).toFixed(1)} MB` : 'Size unavailable'}</p>}
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">Thumbnail {selectedThumbnail ? '(new selection)' : '(saved)'}</div>
        {thumb && !imageError ? <img src={thumb} alt="Saved or selected video thumbnail" className="aspect-video w-full rounded-lg bg-slate-100 object-contain" onError={() => setImageError(true)} /> : <div className="grid aspect-video place-items-center rounded-lg bg-slate-100 text-sm muted">{imageError ? 'Thumbnail could not be loaded' : 'No thumbnail yet'}</div>}
        {selectedThumbnail && <p className="mt-1 break-all text-xs muted">Selected: {selectedThumbnail.name}</p>}
      </div>
    </div>
  </div>;
}

export default function VideosAdminPage() {
  const [data, setData] = useState({data:[]});
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({...initialForm});
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [uploadPercent, setUploadPercent] = useState(null);
  const [loading, setLoading] = useState(true);
  const sectionRequest = useRef(0);
  const saveLock = useRef(false);

  async function reload() {
    const r = await api.get('/admin/videos');
    setData(r.data);
    return r.data;
  }
  useEffect(() => {
    let live = true;
    Promise.all([api.get('/admin/videos'), api.get('/admin/categories'), api.get('/admin/courses')])
      .then(([videos, cats, classes]) => {
        if (!live) return;
        setData(videos.data);
        setCategories(cats.data.data || []);
        setCourses(classes.data.data || []);
      })
      .catch(e => {if (live) setListError(messageFrom(e))})
      .finally(() => {if (live) setLoading(false)});
    return () => {live = false};
  }, []);

  async function fetchSections(courseId) {
    const request = ++sectionRequest.current;
    setSections([]);
    if (!courseId) {setLoadingSections(false); return}
    setLoadingSections(true);
    try {
      const {data: course} = await api.get(`/admin/courses/${courseId}`);
      if (sectionRequest.current === request) setSections(course.sections || []);
    } catch (e) {
      if (sectionRequest.current === request) setFormError(`Unable to load course sections: ${messageFrom(e)}`);
    } finally {
      if (sectionRequest.current === request) setLoadingSections(false);
    }
  }
  function addVideo() {
    if (saving || deletingId != null) return;
    setCurrent(null);
    setForm({...initialForm, category_id: categories[0]?.id || ''});
    setFormError(''); setNotice(''); setUploadPercent(null);
    setSections([]); ++sectionRequest.current;
    setFormOpen(true);
  }
  async function editVideo(row) {
    if (saving || deletingId != null) return;
    setFormError(''); setNotice(''); setUploadPercent(null);
    try {
      const {data: saved} = await api.get(`/admin/videos/${row.id}`);
      setCurrent(saved);
      setForm({
        ...initialForm,
        ...Object.fromEntries(formFields.map(key => [key, saved[key] ?? initialForm[key]])),
        category_id: saved.category_id || '', course_id: saved.course_id || '',
        course_section_id: saved.course_section_id || '',
        is_free: Boolean(saved.is_free), is_preview: Boolean(saved.is_preview),
        is_featured: Boolean(saved.is_featured), video: null, thumbnail: null
      });
      setFormOpen(true);
      await fetchSections(saved.course_id);
    } catch (e) {
      setListError(`Unable to open video: ${messageFrom(e)}`);
    }
  }
  function close() {
    if (saving) return;
    ++sectionRequest.current;
    setFormOpen(false);
  }
  function change(key, value) {
    setForm(previous => ({...previous, [key]: value}));
    setFormError('');
  }
  async function save(e) {
    e.preventDefault();
    if (saveLock.current) return;
    saveLock.current = true;
    setFormError(''); setNotice(''); setUploadPercent(null);
    const err = validateFile(form.video, allowedVideo, videoLimit, 'Video') || validateFile(form.thumbnail, allowedThumbnail, imageLimit, 'Thumbnail');
    if (err || (!current && !(form.video instanceof File))) {
      setFormError(err || 'Choose an MP4 or WebM video file.');
      saveLock.current = false;
      return;
    }
    if (!form.title_en.trim() || Number(form.price) < 0 || Number(form.duration_seconds) < 0 || Number(form.display_order) < 0) {
      setFormError('Enter a title and non-negative price, duration and display order.');
      saveLock.current = false;
      return;
    }
    setSaving(true);
    let accepted = false;
    try {
      await csrf();
      const payload = new FormData();
      for (const key of formFields) {
        if (key === 'slug' && !String(form.slug || '').trim() && !current) continue;
        const value = form[key];
        payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? ''));
      }
      if (form.video instanceof File) payload.append('video', form.video, form.video.name);
      if (form.thumbnail instanceof File) payload.append('thumbnail', form.thumbnail, form.thumbnail.name);
      const response = await api.post(current ? `/admin/videos/${current.id}` : '/admin/videos', payload, {
        onUploadProgress: event => {
          if (event.total) setUploadPercent(Math.min(100, Math.round(event.loaded * 100 / event.total)));
        }
      });
      accepted = true;
      const id = current?.id || response.data?.id;
      if (!id) throw new Error('Server accepted the request but did not return a video ID. Check the list before retrying.');
      const {data: verified} = await api.get(`/admin/videos/${id}`);
      if (String(verified.title_en) !== form.title_en.trim() || String(verified.status) !== String(form.status) || !verified.has_video) {
        throw new Error('The server accepted the save, but the saved title/status/video could not be verified. Check the list before retrying.');
      }
      const warning = await reload().then(() => '').catch(() => ' Refresh the list to see the latest video.');
      setFormOpen(false);
      setNotice(`Video ${current ? 'updated' : 'uploaded'} and verified successfully.${warning}`);
    } catch (e) {
      setFormError(`${accepted ? 'Save was accepted but confirmation did not complete. Check the list before retrying. ' : ''}${messageFrom(e)}`);
    } finally {
      saveLock.current = false;
      setSaving(false);
      setUploadPercent(null);
    }
  }
  async function deleteVideo(row) {
    if (saving || deletingId != null) return;
    if (!window.confirm(`Delete video "${row.title_en}"? This cannot be undone. Videos with payment history cannot be deleted.`)) return;
    setListError(''); setNotice(''); setDeletingId(row.id);
    try {
      await csrf();
      await api.delete(`/admin/videos/${row.id}`);
      await reload();
      setNotice('Video deleted successfully.');
    } catch (e) {
      setListError(messageFrom(e));
    } finally {
      setDeletingId(null);
    }
  }

  return <>
    <div className="flex items-center justify-between gap-3">
      <div><h1 className="text-2xl font-black">Videos</h1><p className="mt-1 muted">Upload a standalone video or attach a lesson to a course and section.</p></div>
      <button className="btn-primary" type="button" onClick={addVideo} disabled={saving || deletingId != null}><Plus size={17}/>Upload Video</button>
    </div>
    {notice && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={16} className="mr-2 inline"/>{notice}</p>}
    {listError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{listError}</p>}
    <div className="card mt-6 overflow-auto">
      {loading ? <p className="p-5 muted">Loading videos...</p> : <table className="admin-table">
        <thead><tr><th>Video</th><th>Course</th><th>Access</th><th>Price</th><th>Status</th><th>Views</th><th>Actions</th></tr></thead>
        <tbody>{(data.data || []).map(v => <tr key={v.id}>
          <td><div className="flex items-center gap-3">{v.thumbnail_path ? <img src={asset(v.thumbnail_path)} alt="" className="h-14 w-20 rounded-lg bg-slate-100 object-cover"/> : <Film className="text-slate-400" size={22}/>}<div><b>{v.title_en}</b><div className="text-xs muted">{v.duration_seconds || 0}s · {v.has_video ? 'Video stored' : 'No stored video'}</div></div></div></td>
          <td>{v.course?.title_en || (v.course_id ? `Course #${v.course_id}` : 'Standalone')}</td>
          <td>{v.is_preview ? 'Public preview' : v.is_free ? 'Free' : 'Paid / course access'}</td>
          <td>{v.is_free ? 'Free' : `${v.price} ${v.currency}`}</td>
          <td><StatusBadge status={v.status}/></td>
          <td>{v.views}</td>
          <td><div className="flex gap-2">
            <button type="button" className="rounded-lg p-2 hover:bg-blue-50" title="Edit / preview video" aria-label={`Edit ${v.title_en}`} onClick={() => editVideo(v)} disabled={deletingId != null}><Pencil size={16}/></button>
            <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40" title="Delete video" aria-label={`Delete ${v.title_en}`} onClick={() => deleteVideo(v)} disabled={deletingId != null}>{deletingId === v.id ? 'Deleting...' : <Trash2 size={16}/>}</button>
          </div></td>
        </tr>)}</tbody>
      </table>}
    </div>
    <Modal open={formOpen} wide title={current ? `Edit Video · ${current.title_en}` : 'Upload Video'} onClose={close}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
        <fieldset disabled={saving} className="contents">
          <label><span className="label">Category</span><select className="input" value={form.category_id} onChange={e => change('category_id', e.target.value)}><option value="">None</option>{categories.map(x => <option key={x.id} value={x.id}>{x.name_en}</option>)}</select></label>
          <label><span className="label">Course</span><select className="input" value={form.course_id} onChange={e => {const v=e.target.value;setForm(p => ({...p, course_id:v, course_section_id:''}));fetchSections(v)}}><option value="">Standalone video</option>{courses.map(x => <option key={x.id} value={x.id}>{x.title_en}</option>)}</select></label>
          <label><span className="label">Course section</span><select className="input" value={form.course_section_id} disabled={!form.course_id || loadingSections} onChange={e => change('course_section_id', e.target.value)}><option value="">{loadingSections ? 'Loading sections...' : 'No section'}</option>{sections.map(x => <option key={x.id} value={x.id}>{x.title_en}</option>)}</select></label>
          <label><span className="label">Status</span><select className="input" value={form.status} onChange={e => change('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select></label>
          {[
            ['title_en','English title'],['title_fa','Dari title'],['slug','Slug (optional on new video)'],
            ['duration_seconds','Duration (seconds)'],['price','Price'],['display_order','Display order']
          ].map(([key,label]) => <label key={key}><span className="label">{label}</span><input className="input" value={form[key] ?? ''} required={key === 'title_en' || key === 'price'} type={['duration_seconds','price','display_order'].includes(key) ? 'number' : 'text'} min={['duration_seconds','price','display_order'].includes(key) ? '0' : undefined} onChange={e => change(key,e.target.value)}/></label>)}
          <label><span className="label">Currency</span><select className="input" value={form.currency} onChange={e => change('currency',e.target.value)}><option>AFN</option><option>USD</option></select></label>
          <label><span className="label">Video file · MP4 or WebM (max 60 MB)</span><input className="input" type="file" accept="video/mp4,video/webm" required={!current} onChange={e => change('video', e.target.files?.[0] || null)}/></label>
          <label><span className="label">Thumbnail · JPG, PNG or WebP (max 8 MB)</span><input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => change('thumbnail',e.target.files?.[0] || null)}/></label>
          <VideoStoredPreview video={current} selectedVideo={form.video} selectedThumbnail={form.thumbnail}/>
          <div className="flex flex-wrap gap-5 md:col-span-2">{[['is_free','Free'],['is_preview','Public preview'],['is_featured','Featured']].map(([key,label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form[key])} onChange={e => change(key,e.target.checked)}/>{label}</label>)}</div>
          {form.is_preview && <p className="md:col-span-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Public preview allows anyone to watch this video without purchasing. Only enable it for content you intend to share.</p>}
          <label className="md:col-span-2"><span className="label">English description</span><textarea className="input min-h-28" value={form.description_en} onChange={e => change('description_en',e.target.value)}/></label>
          <label className="md:col-span-2"><span className="label">Dari description</span><textarea className="input min-h-28" value={form.description_fa} onChange={e => change('description_fa',e.target.value)}/></label>
          <label><span className="label">SEO title</span><input className="input" value={form.meta_title} onChange={e => change('meta_title',e.target.value)}/></label>
          <label><span className="label">SEO description</span><input className="input" value={form.meta_description} onChange={e => change('meta_description',e.target.value)}/></label>
        </fieldset>
        {formError && <p role="alert" className="md:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <button type="submit" className="btn-primary md:col-span-2" disabled={saving || loadingSections}>{saving ? `Saving...${uploadPercent === null ? '' : ` upload ${uploadPercent}%`}` : current ? 'Save Video Changes' : 'Upload & Save Video'}</button>
      </form>
    </Modal>
  </>;
}
