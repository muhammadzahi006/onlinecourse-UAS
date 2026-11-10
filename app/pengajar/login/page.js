'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';

export default function InstructorLoginPage(){
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[error,setError]=useState('');
  const[busy,setBusy]=useState(false);
  async function submit(event){
    event.preventDefault();
    setError('');
    setBusy(true);
    const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const {error:loginError}=await supabase.auth.signInWithPassword({email,password});
    if(loginError){setBusy(false);setError('Email atau kata sandi tidak valid.');return;}
    const access=await fetch('/api/auth/instructor-session',{cache:'no-store'});
    if(!access.ok){
      await supabase.auth.signOut();
      setBusy(false);
      setError(access.status===403?'Akun ini belum memiliki role Pengajar. Hubungi admin untuk mengaktifkannya.':'Sesi pengajar tidak dapat diverifikasi. Coba lagi.');
      return;
    }
    location.assign('/dashboard/pengajar');
  }
  return <main className="auth-page instructor-auth-page">
    <a className="brand auth-brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></a>
    <section className="auth-card"><div className="eyebrow"><span className="eyebrow-line"/> RUANG UNTUK MENGAJAR</div><h1>Masuk sebagai pengajar.</h1><p>Kelola kelas dan lihat perkembangan peserta yang belajar bersamamu.</p>
      <form onSubmit={submit}><label>Email pengajar<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} autoComplete="username"/></label><label>Kata sandi<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete="current-password"/></label>{error&&<div className="auth-error" role="alert">{error}</div>}<button className="button button-dark auth-submit" disabled={busy}>{busy?'Memverifikasi…':'Masuk ke dashboard pengajar'} <span>↗</span></button></form>
      <div className="auth-switch"><a href="/login">Masuk sebagai peserta</a></div><a className="auth-admin-link" href="/admin/login">Masuk khusus administrator →</a>
    </section><span className="auth-note">Akses pengajar diverifikasi oleh server.</span>
  </main>;
}
