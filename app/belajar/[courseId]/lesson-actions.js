'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function LessonActions({lessonId,done}) {
  const router=useRouter();
  const [completed,setCompleted]=useState(done); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function markDone() { setBusy(true);setError('');try{const response=await fetch('/api/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({lessonId})});const result=await response.json();if(!response.ok)throw new Error(result.error);setCompleted(true);router.refresh()}catch(e){setError(e.message)}finally{setBusy(false)} }
  return <div className="lesson-action"><button disabled={completed||busy} onClick={markDone}>{completed?'Selesai ✓':busy?'Menyimpan…':'Tandai selesai'}</button>{error&&<small role="alert">{error}</small>}</div>;
}
