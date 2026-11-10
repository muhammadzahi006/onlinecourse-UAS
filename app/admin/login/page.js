'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';

export default function AdminLoginPage(){
  const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[error,setError]=useState('');const[busy,setBusy]=useState(false);
  async function submit(event){
    event.preventDefault();setError('');
    if(password.length<8)return setError('Masukkan kata sandi yang valid.');
    setBusy(true);
    const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const {error:loginError}=await supabase.auth.signInWithPassword({email,password});
    if(loginError){setBusy(false);return setError('Email atau kata sandi tidak valid.');}
    const access=await fetch('/api/auth/admin-session',{cache:'no-store'});
    if(!access.ok){
      await supabase.auth.signOut();
      setBusy(false);
      return setError(access.status===403?'Akun ini belum memiliki akses administrator.':'Sesi admin tidak dapat diverifikasi.');
    }
    location.assign('/dashboard');
  }
  return <main className="auth-page admin-auth-page"><a className="brand auth-brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></a><section className="auth-card"><div className="eyebrow"><span className="eyebrow-line"/> AREA ADMINISTRATOR</div><h1>Masuk ke panel admin.</h1><p>Gunakan akun yang sudah diberi role administrator.</p><form onSubmit={submit}><label>Email administrator<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} autoComplete="username"/></label><label>Kata sandi<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="current-password"/></label>{error&&<div className="auth-error" role="alert">{error}</div>}<button className="button button-dark auth-submit" disabled={busy}>{busy?'Memverifikasi…':'Masuk sebagai admin'} <span>↗</span></button></form><div className="auth-switch"><a href="/login">Masuk sebagai peserta atau pengajar</a></div></section><span className="auth-note">Akses admin diverifikasi di server.</span></main>;
}
