import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { LessonActions } from './lesson-actions';
import { QuizForm } from './quiz-form';

export default async function LearningPage({ params }) {
  const auth=await requireUser(['STUDENT']); if(auth.error) redirect('/login');
  const {courseId}=await params;
  const course=await prisma.course.findFirst({where:{id:courseId,status:'PUBLISHED'},include:{lessons:{orderBy:{position:'asc'}},quizzes:true,category:true}});
  if(!course) notFound();
  const enrollment=await prisma.enrollment.findUnique({where:{studentId_courseId:{studentId:auth.user.id,courseId}}}); if(!enrollment) redirect('/#kelas');
  const progress=await prisma.lessonProgress.findMany({where:{studentId:auth.user.id,lesson:{courseId}},select:{lessonId:true}});
  const attempts=await prisma.quizAttempt.findMany({where:{studentId:auth.user.id,quiz:{courseId}},orderBy:{submittedAt:'desc'}});
  const done=new Set(progress.map(p=>p.lessonId));
  const safeQuizzes=course.quizzes.map(({id,title,questions})=>({id,title,questions}));
  return <main className="learning-page"><header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></Link><Link className="text-link" href="/dashboard">← Kembali ke dashboard</Link></header><div className="learning-content"><div className="eyebrow"><span className="eyebrow-line"/> {course.category.name.toUpperCase()}</div><h1>{course.title}</h1><p>{course.description}</p><div className="progress-track"><span style={{width:`${course.lessons.length?Math.round(done.size/course.lessons.length*100):0}%`}}/></div><small>{done.size} dari {course.lessons.length} materi selesai</small><div className="lesson-list">{course.lessons.map((lesson,index)=><article className="lesson-card" key={lesson.id}><span className={`lesson-number ${done.has(lesson.id)?'lesson-done':''}`}>{done.has(lesson.id)?'✓':String(index+1).padStart(2,'0')}</span><div><h2>{lesson.title}</h2><p>{lesson.contentText}</p></div><LessonActions lessonId={lesson.id} done={done.has(lesson.id)}/></article>)}</div>{safeQuizzes.map(quiz=><QuizForm key={quiz.id} quiz={quiz} attempt={attempts.find(a=>a.quizId===quiz.id)}/> )}</div></main>;
}
