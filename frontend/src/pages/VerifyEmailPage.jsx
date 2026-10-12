import {useEffect,useRef,useState} from 'react';
import {useNavigate,useSearchParams} from 'react-router-dom';
import {api,csrf,messageFrom} from '../api/client';
import Seo from '../components/Seo';
import {useAuth} from '../context/AuthContext';

export default function VerifyEmailPage(){
  const [sp]=useSearchParams();
  const [email]=useState(sp.get('email')||'');
  const [code,setCode]=useState('');
  const [msg,setMsg]=useState('');
  const [err,setErr]=useState('');
  const [sending,setSending]=useState(false);
  const autoSent=useRef(false);
  const {refresh}=useAuth();
  const nav=useNavigate();

  // Registration already sends the first code. Resend is manual to avoid duplicate emails.

  const verify=async e=>{
    e.preventDefault();
    setErr('');

    try{
      await csrf();
      await api.post('/auth/verify-otp',{email,code});
      await refresh();
      nav('/dashboard');
    }catch(e){
      setErr(messageFrom(e));
    }
  };

  const resend=async()=>{
    if(sending)return;

    setSending(true);
    setErr('');
    setMsg('Sending verification code...');

    try{
      await csrf();
      const {data}=await api.post('/auth/resend-otp',{email});
      setMsg(data.message||'Verification code sent.');
    }catch(e){
      setMsg('');
      setErr(messageFrom(e));
    }finally{
      setSending(false);
    }
  };

  return (
    <div className="container-page py-12">
      <Seo title="Verify Email"/>
      <div className="mx-auto max-w-md card p-7 text-center">
        <h1 className="text-2xl font-black">Verify your email</h1>

        <p className="mt-2 text-sm muted">
          Enter the 6-digit code sent to <b>{email}</b>.
        </p>

        <form onSubmit={verify} className="mt-6">
          <input
            className="input text-center text-2xl font-black tracking-[.35em]"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={e=>setCode(e.target.value.replace(/\D/g,''))}
          />

          {err&&<p className="mt-3 text-sm text-red-600">{err}</p>}
          {msg&&<p className="mt-3 text-sm text-green-600">{msg}</p>}

          <button
            disabled={code.length!==6}
            className="btn-primary mt-4 w-full"
          >
            Verify Email
          </button>
        </form>

        <button
          type="button"
          disabled={sending}
          className="mt-4 text-sm font-bold text-[var(--primary)] disabled:opacity-50"
          onClick={resend}
        >
          {sending?'Sending code...':'Resend code'}
        </button>
      </div>
    </div>
  );
}