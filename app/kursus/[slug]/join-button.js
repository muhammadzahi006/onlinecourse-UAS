'use client';
import {useState} from 'react';
export function JoinCourse({courseId}) {
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function join(){setBusy(true);setError('');try{const response=await fetch('/api/enrollments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({courseId})});const result=await response.json();if(response.status===401){location.assign(`/login?next=${encodeURIComponent(`/belajar/${courseId}`)}`);return}if(response.status===409){location.assign(`/belajar/${courseId}`);return}if(!response.ok)throw new Error(result.error);location.assign(`/belajar/${courseId}`)}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <div><button className="button button-dark enroll-cta" onClick={join} disabled={busy}>{busy?'Memproses…':'Daftar kursus'} <span>↗</span></button>{error&&<p className="auth-error" role="alert">{error}</p>}</div>;
}
