// MR_SUPER_INDEPENDENT_ASSETS_V1: each asset has its own selection, status, upload and DB verification.
import {useEffect, useState} from 'react';
import {api, asset, csrf, messageFrom} from '../../api/client';
import {useSite} from '../../context/SiteContext';

const uploadItems = [
  {
    key: 'logo_path',
    title: 'Website Logo',
    description: 'Appears in the website header. Recommended: transparent PNG or WebP.',
    button: 'Upload Logo',
    imageClass: 'h-28 max-w-full',
  },
  {
    key: 'favicon_path',
    title: 'Website Favicon',
    description: 'Small icon in the browser tab. Recommended: square PNG.',
    button: 'Upload Favicon',
    imageClass: 'h-20 max-w-full',
  },
  {
    key: 'hesabpay_qr_path',
    title: 'Official HesabPay Receiving QR',
    description: 'Payment QR shown to students. Upload only the genuine receiving QR for your own account.',
    button: 'Upload HesabPay QR',
    imageClass: 'h-52 max-w-full',
  },
];
const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BYTES = 8 * 1024 * 1024;
const asPath = value => typeof value === 'string' ? value : '';

function UploadCard({item, currentPath, onSuccess}) {
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    if (!selected) {setPreview(''); return}
    const url = URL.createObjectURL(selected);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selected]);
  useEffect(() => {setImageFailed(false)}, [currentPath]);

  async function upload() {
    setError('');
    setSuccess('');
    if (!selected) {setError('Select a file first.'); return}
    if (!allowedTypes.has(selected.type)) {setError('Choose PNG, JPG or WebP (SVG is not supported).'); return}
    if (selected.size > MAX_BYTES) {setError('Image must be smaller than 8 MB.'); return}
    if (selected.size === 0) {setError('The selected file is empty.'); return}
    setBusy(true);
    try {
      await csrf();
      const form = new FormData();
      form.append('key', item.key);
      form.append('file', selected, selected.name);
      const response = await api.post('/admin/cms/settings/assets', form);
      const savedPath = asPath(response?.data?.path);
      if (!savedPath) throw new Error('Server returned no saved image path.');
      // Verify that the correct specific key was persisted before showing success.
      const verified = await api.get('/admin/cms/settings');
      const actual = asPath(verified.data.find(row => row.key === item.key)?.value);
      if (actual !== savedPath) throw new Error('Image uploaded but its saved setting could not be confirmed.');
      onSuccess(item.key, savedPath);
      setSelected(null);
      setSuccess('Uploaded and saved successfully. Other images were not changed.');
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  return <section className="card p-5" aria-label={item.title}>
    <h2 className="text-xl font-extrabold">{item.title}</h2>
    <p className="mt-2 text-sm muted">{item.description}</p>
    <div className="mt-4 flex min-h-32 items-center justify-center rounded-xl border bg-slate-50 p-4">
      {currentPath && !imageFailed
        ? <img src={asset(currentPath)} alt={'Current ' + item.title} className={item.imageClass + ' object-contain'} onError={() => setImageFailed(true)}/>
        : <span className="text-sm text-slate-500">{currentPath ? 'Saved image is not reachable; you can replace it.' : 'No image uploaded yet.'}</span>}
    </div>
    {selected && preview && <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed p-3">
      <img src={preview} alt="Selected image preview" className="h-16 w-16 shrink-0 object-contain"/>
      <p className="min-w-0 break-all text-xs">Selected: {selected.name}</p>
    </div>}
    <label className="mt-4 block">
      <span className="label">Choose image (PNG, JPG, WebP; max 8 MB)</span>
      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} className="input" onChange={event => {setSelected(event.target.files?.[0] || null);setError('');setSuccess('')}}/>
    </label>
    <button type="button" disabled={busy || !selected} onClick={upload} className="btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-50">
      {busy ? 'Uploading...' : item.button}
    </button>
    {error && <p role="alert" className="mt-3 break-words text-sm text-red-600">{error}</p>}
    {success && <p role="status" className="mt-3 text-sm text-green-700">{success}</p>}
  </section>;
}

export default function BrandAssetsAdminPage() {
  const [paths, setPaths] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const {refresh} = useSite();
  useEffect(() => {
    let mounted = true;
    api.get('/admin/cms/settings').then(({data}) => {
      if (!mounted) return;
      const next = {};
      for (const item of uploadItems) next[item.key] = asPath(data.find(row => row.key === item.key)?.value);
      setPaths(next);
    }).catch(err => {if (mounted) setError(messageFrom(err))})
      .finally(() => {if (mounted) setLoading(false)});
    return () => {mounted = false};
  }, []);

  function onSuccess(key, savedPath) {
    setPaths(previous => ({...previous, [key]: savedPath}));
    refresh().catch(() => {});
  }

  return <>
    <h1 className="text-2xl font-black">Logo, Favicon & Payment QR</h1>
    <p className="mt-1 muted">Three independent upload areas. Saving one never saves or replaces the other two.</p>
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    {loading ? <p className="mt-6 muted">Loading current images...</p>
      : <div className="mt-6 grid max-w-6xl gap-5 lg:grid-cols-3">
        {uploadItems.map(item => <UploadCard key={item.key} item={item} currentPath={paths[item.key] || ''} onSuccess={onSuccess}/>)}
      </div>}
  </>;
}
