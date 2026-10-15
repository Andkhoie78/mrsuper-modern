// MR_SUPER_INDEPENDENT_ASSETS_V1: SEO settings save only text and visibility fields; never overwrite asset keys.
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {api, csrf, messageFrom} from '../../api/client';
import {useSite} from '../../context/SiteContext';

const fields = [
  ['site_name', 'Website Name'],
  ['site_description', 'Website Description'],
  ['contact_email', 'Contact Email'],
  ['contact_phone', 'Phone Number'],
  ['contact_address', 'Address'],
  ['copyright_text', 'Copyright Text'],
  ['login_button_text', 'Login Button Text'],
  ['register_button_text', 'Register Button Text'],
  ['facebook_url', 'Facebook URL'],
  ['instagram_url', 'Instagram URL'],
  ['youtube_url', 'YouTube URL'],
  ['seo_title', 'Default SEO Title'],
  ['seo_description', 'Meta Description'],
  ['seo_keywords', 'Meta Keywords'],
];
const visible = value => value !== false && value !== 0 && value !== '0' && value !== 'false';
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value) : '';

export default function SettingsAdminPage() {
  const [form, setForm] = useState({show_login_button: true, show_register_button: true});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const {refresh} = useSite();

  useEffect(() => {
    let mounted = true;
    api.get('/admin/cms/settings').then(({data}) => {
      if (!mounted) return;
      const values = Object.fromEntries(data.map(item => [item.key, item.value]));
      const next = {};
      for (const [key] of fields) next[key] = text(values[key]);
      next.show_login_button = visible(values.show_login_button);
      next.show_register_button = visible(values.show_register_button);
      setForm(next);
    }).catch(err => {
      if (mounted) setError(messageFrom(err));
    }).finally(() => {if (mounted) setLoading(false)});
    return () => {mounted = false};
  }, []);

  async function save(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      // Important: these are the ONLY settings allowed through the SEO form.
      // logo_path, favicon_path and hesabpay_qr_path have independent upload controls.
      const settings = {};
      for (const [key] of fields) settings[key] = text(form[key]);
      settings.show_login_button = Boolean(form.show_login_button);
      settings.show_register_button = Boolean(form.show_register_button);
      await csrf();
      await api.put('/admin/cms/settings', {settings, group: 'general'});
      const {data} = await api.get('/admin/cms/settings');
      const stored = Object.fromEntries(data.map(item => [item.key, item.value]));
      const confirmed = Object.entries(settings).every(([key, value]) =>
        stored[key] === value || String(stored[key]) === String(value)
      );
      if (!confirmed) throw new Error('Some changes were not confirmed in the database. Please retry or check the server logs.');
      setMessage('Settings saved and verified. The logo, favicon and payment QR were not changed.');
      // Public config refresh is helpful, but not a reason to misreport a saved DB write.
      refresh().catch(() => {});
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setSaving(false);
    }
  }

  return <>
    <h1 className="text-2xl font-black">SEO & Website Settings</h1>
    <p className="mt-1 muted">Edit your website name, contact details and SEO information here.</p>
    <p className="mt-3 text-sm">
      Logo, Favicon and HesabPay receiving QR are managed separately in{' '}
      <Link to="/admin/assets" className="font-bold text-blue-700 underline">Logo, Favicon & QR</Link>.
    </p>
    <form className="card mt-6 grid max-w-3xl gap-4 p-6 md:grid-cols-2" onSubmit={save}>
      <div className="md:col-span-2 flex flex-wrap gap-5 rounded-xl bg-slate-50 p-4">
        <label className="flex items-center gap-2 font-semibold"><input type="checkbox" disabled={loading || saving} checked={Boolean(form.show_login_button)} onChange={e => setForm(current => ({...current, show_login_button: e.target.checked}))}/>Show Login Button</label>
        <label className="flex items-center gap-2 font-semibold"><input type="checkbox" disabled={loading || saving} checked={Boolean(form.show_register_button)} onChange={e => setForm(current => ({...current, show_register_button: e.target.checked}))}/>Show Register Button</label>
      </div>
      {fields.map(([key, label]) => <label key={key} className={key.includes('description') ? 'md:col-span-2' : ''}>
        <span className="label">{label}</span>
        {key.includes('description')
          ? <textarea className="input min-h-24" disabled={loading || saving} value={form[key] ?? ''} onChange={e => setForm(current => ({...current, [key]: e.target.value}))}/>
          : <input className="input" disabled={loading || saving} value={form[key] ?? ''} onChange={e => setForm(current => ({...current, [key]: e.target.value}))}/>}
      </label>)}
      {error && <p role="alert" className="md:col-span-2 text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="md:col-span-2 text-sm text-green-700">{message}</p>}
      <button type="submit" disabled={loading || saving} className="btn-primary md:col-span-2 disabled:opacity-50">
        {loading ? 'Loading settings...' : saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  </>;
}
