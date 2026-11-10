'use client';
import {useEffect,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';

export default function LoginPage(){
  const[mode,setMode]=useState('login');
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[name,setName]=useState('');
  const[error,setError]=useState('');
  const[busy,setBusy]=useState(false);
  useEffect(()=>{if(new URLSearchParams(location.search).get('mode')==='signup')setMode('signup')},[]);
  async function submit(event){
    event.preventDefault();setError('');
    if(password.length<8)return setError('Kata sandi minimal 8 karakter.');
    if(mode==='signup'&&name.trim().length<2)return setError('Nama harus terdiri dari minimal 2 karakter.');
    setBusy(true);
    const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const result=mode==='signup'
      ? await supabase.auth.signUp({email,password,options:{data:{full_name:name.trim()}}})
      : await supabase.auth.signInWithPassword({email,password});
    setBusy(false);
    if(result.error)return setError(result.error.message);
    if(mode==='signup'&&!result.data.session)return setError('Cek emailmu untuk mengonfirmasi akun sebelum masuk.');
    const next=new URLSearchParams(location.search).get('next');
    const destination=next?new URL(next,location.origin):new URL('/dashboard',location.origin);
    location.assign(destination.origin===location.origin?destination.pathname+destination.search+destination.hash:'/dashboard');
  }
  return <main className="auth-page"><a className="brand auth-brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></a><section className="auth-card">
    <div className="eyebrow"><span className="eyebrow-line"/> RUANG UNTUK BERTUMBUH</div><h1>{mode==='login'?'Senang melihatmu lagi.':'Mulai perjalananmu.'}</h1><p>Masuk ke akunmu dan lanjutkan belajar hal baru.</p>
    <form onSubmit={submit}>{mode==='signup'&&<label>Nama lengkap<input value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name"/></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} autoComplete="email"/></label><label>Kata sandi<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete={mode==='login'?'current-password':'new-password'}/></label>{error&&<div className="auth-error" role="alert">{error}</div>}<button className="button button-dark auth-submit" disabled={busy}>{busy?'Mohon tunggu…':mode==='login'?'Masuk ke akun':'Buat akun'} <span>↗</span></button></form>
    <div className="auth-switch">{mode==='login'?'Belum punya akun?':'Sudah punya akun?'} <button onClick={()=>{setError('');setMode(mode==='login'?'signup':'login')}}>{mode==='login'?'Daftar sekarang':'Masuk'}</button></div>
    <a className="auth-admin-link" href="/pengajar/login">Masuk khusus pengajar →</a><a className="auth-admin-link" href="/admin/login">Masuk khusus administrator →</a>
  </section><span className="auth-note">Belajar hari ini, jadi versi terbaik esok hari.</span></main>;
}
