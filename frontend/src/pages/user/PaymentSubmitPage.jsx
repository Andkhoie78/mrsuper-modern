import {useEffect,useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {api,asset,csrf,messageFrom} from '../../api/client';
import {useSite} from '../../context/SiteContext';
import FormField from '../../components/FormField';
import Loading from '../../components/Loading';

export default function PaymentSubmitPage(){
  const [sp]=useSearchParams();
  const type=sp.get('type'),id=sp.get('id');
  const {config}=useSite();
  const nav=useNavigate();
  const [q,setQ]=useState(null);
  const [f,setF]=useState({bank_account_id:'',transaction_reference:'',transaction_information:'',receipt:null});
  const [err,setErr]=useState('');
  const [busy,setBusy]=useState(false);
  const [copied,setCopied]=useState(false);
  useEffect(()=>{
    let alive=true;
    setQ(null);setErr('');
    if(type&&id)api.get(`/user/payments/quote/${type}/${id}`).then(r=>{
      if(!alive)return;
      setQ(r.data);
      if(r.data.bank_accounts?.[0])setF(x=>({...x,bank_account_id:String(r.data.bank_accounts[0].id)}));
    }).catch(e=>{if(alive)setErr(messageFrom(e))});
    else setErr('Invalid payment link.');
    return()=>{alive=false};
  },[type,id]);
  if(!q&&!err)return <Loading/>;
  if(err&&!q)return <div className="card p-6 text-red-600">{err}</div>;
  const account=q.bank_accounts.find(x=>String(x.id)===String(f.bank_account_id));
  const locked=!!(q.already_owned||q.pending_payment);
  const qrPath=config?.settings?.hesabpay_qr_path;
  const copyAccount=async()=>{
    if(!account?.account_number)return;
    try{await navigator.clipboard.writeText(account.account_number);setCopied(true)}catch{setErr('Unable to copy. Select the number manually.');}
  };
  const submit=async e=>{
    e.preventDefault();
    if(locked||busy)return;
    setErr('');setBusy(true);
    try{
      await csrf();
      const fd=new FormData();
      fd.append('content_type',type);fd.append('content_id',id);
      Object.entries(f).forEach(([key,v])=>v!==null&&fd.append(key,v));
      await api.post('/user/payments',fd);
      nav(type==='course'?`/courses/${q.content.slug}`:'/dashboard/payments',{replace:true});
    }catch(e){setErr(messageFrom(e));}finally{setBusy(false);}
  };
  return <div className="max-w-3xl">
    <h1 className="text-2xl font-black">{type==='course'?'Pay with HesabPay':'Submit Bank Payment'}</h1>
    <p className="mt-2 muted">Transfer the exact amount, upload the receipt, and wait for the administrator to check the transaction. No automatic access is granted.</p>
    <div className="card mt-5 p-6">
      <div className="rounded-xl bg-blue-50 p-4"><b>{q.content.title_en}</b><div className="mt-1 text-2xl font-black text-[var(--primary)]">{q.content.price} {q.content.currency}</div></div>
      {q.already_owned&&<div className="mt-4 rounded-xl bg-green-50 p-4 text-green-700">You already have access to this content. {type==='course'&&<Link to={`/courses/${q.content.slug}`} className="underline">Back to course</Link>}</div>}
      {q.pending_payment&&<div className="mt-4 rounded-xl bg-amber-50 p-4 text-amber-900"><b>Payment Pending Approval</b><p className="mt-1 text-sm">A receipt has already been submitted for this course. Please wait for manual verification.</p><Link to="/dashboard/payments" className="mt-2 inline-block font-semibold underline">View payment history</Link></div>}
      {!q.bank_accounts.length&&<div className="mt-4 rounded-xl bg-amber-50 p-4 text-amber-900">No active receiving account is configured. Contact support before paying.</div>}
      {!locked&&q.bank_accounts.length>0&&<>
        {type==='course'&&qrPath&&<div className="mt-5 rounded-xl border border-[var(--border)] p-5 text-center"><div className="font-bold">Scan the official HesabPay QR</div><img src={asset(qrPath)} alt="Official HesabPay receiving QR" className="mx-auto mt-3 h-60 w-60 max-w-full object-contain"/><p className="mt-2 text-xs muted">Check the recipient name and exact amount inside the HesabPay app before you send money.</p></div>}
        {type==='course'&&!qrPath&&<p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">The merchant QR has not been uploaded yet. Use the account number below.</p>}
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <FormField label={type==='course'?'HesabPay receiving account':'Bank account'}><select className="input" required value={f.bank_account_id} onChange={e=>{setF({...f,bank_account_id:e.target.value});setCopied(false)}}>{q.bank_accounts.map(b=><option key={b.id} value={b.id}>{b.bank_name} — {b.account_holder_name}</option>)}</select></FormField>
          {account&&<div className="rounded-xl border border-[var(--border)] bg-slate-50 p-4 text-sm"><b>{account.bank_name}</b><div className="mt-1">Account holder: {account.account_holder_name}</div><div className="mt-2 flex flex-wrap items-center gap-2"><span className="break-all font-bold">{account.account_number}</span><button type="button" className="btn-secondary" onClick={copyAccount}>{copied?'Copied!':'Copy number'}</button></div>{account.additional_information&&<p className="mt-2 muted">{account.additional_information}</p>}</div>}
          <p className="text-sm muted">1. Scan the QR or copy the account number. 2. Pay using your HesabPay app. 3. Upload the actual payment screenshot below.</p>
          <FormField label="Transaction reference (optional)"><input className="input" maxLength="190" value={f.transaction_reference} onChange={e=>setF({...f,transaction_reference:e.target.value})}/></FormField>
          <FormField label="Transaction details"><textarea required className="input min-h-28" maxLength="3000" placeholder="Transfer date, sender name and payment details" value={f.transaction_information} onChange={e=>setF({...f,transaction_information:e.target.value})}/></FormField>
          <FormField label="Upload payment screenshot"><input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="input" onChange={e=>setF({...f,receipt:e.target.files?.[0]||null})}/></FormField>
          {err&&<p className="text-sm text-red-600">{err}</p>}
          <button disabled={busy||!account||!f.receipt} className="btn-primary">{busy?'Submitting…':'Submit Receipt for Admin Approval'}</button>
        </form>
      </>}
    </div>
  </div>;
}
