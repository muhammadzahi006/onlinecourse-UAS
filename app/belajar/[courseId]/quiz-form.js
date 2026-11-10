'use client';
import { useState } from 'react';

export function QuizForm({quiz,attempt}) {
  const [answer,setAnswer]=useState(''); const [score,setScore]=useState(attempt?.score ?? null); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const questions=Array.isArray(quiz.questions)?quiz.questions:[];
  async function submit(event) {
    event.preventDefault();setError('');if(answer==='')return setError('Pilih jawaban terlebih dahulu.');setBusy(true);
    try{const response=await fetch('/api/quizzes/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({quizId:quiz.id,answers:[Number(answer)]})});const result=await response.json();if(!response.ok)throw new Error(result.error);setScore(result.score)}catch(e){setError(e.message)}finally{setBusy(false)}
  }
  return <div className="quiz-card"><div className="eyebrow"><span className="eyebrow-line"/> CEK PEMAHAMAN</div><h2>{quiz.title}</h2>{score!==null&&<p className="quiz-result">Nilai terakhir: <strong>{score}/100</strong></p>}<form onSubmit={submit}><fieldset><legend>{questions[0]?.question||'Pilih jawaban yang tepat.'}</legend>{(questions[0]?.options||[]).map((option,index)=><label className="quiz-option" key={option}><input type="radio" name="answer" value={index} checked={answer===String(index)} onChange={e=>setAnswer(e.target.value)}/>{option}</label>)}</fieldset>{error&&<p className="auth-error" role="alert">{error}</p>}<button className="button button-dark" disabled={busy}>{busy?'Mengirim…':'Kirim jawaban'} <span>↗</span></button></form></div>;
}
