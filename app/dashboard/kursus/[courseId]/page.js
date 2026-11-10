import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';
import {PublishButton} from './publish-button';

export default async function InstructorCoursePage({params}) {
  const auth=await requireUser(['INSTRUCTOR','ADMIN']);if(auth.error)redirect('/login');
  const {courseId}=await params;
  const course=await prisma.course.findFirst({where:{id:courseId,...(auth.profile.role==='ADMIN'?{}:{instructorId:auth.user.id})},include:{enrollments:{include:{student:{select:{fullName:true,progresses:{where:{lesson:{courseId}},select:{id:true}}}}},orderBy:{enrolledAt:'desc'}},lessons:{orderBy:{position:'asc'}},quizzes:{include:{attempts:{include:{student:{select:{fullName:true}}},orderBy:{submittedAt:'desc'}}}}}});
  if(!course)notFound();
  const attempts=course.quizzes.flatMap(q=>q.attempts.map(a=>({...a,quizTitle:q.title})));
  return <main className="learning-page"><header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></Link><Link className="text-link" href="/dashboard">← Dashboard</Link></header><div className="learning-content"><div className="eyebrow"><span className="eyebrow-line"/> RUANG PENGAJAR</div><h1>{course.title}</h1><p>{course.enrollments.length} peserta · {course.lessons.length} materi · {course.status==='PUBLISHED'?'Terpublikasi':'Draft'}</p><PublishButton courseId={course.id} status={course.status}/><div className="instructor-roster"><h2>Peserta terdaftar</h2>{course.enrollments.length===0?<p>Belum ada peserta mendaftar.</p>:course.enrollments.map(e=><div key={e.id}><span className="profile-chip">{e.student.fullName[0]}</span><strong>{e.student.fullName}</strong><small>Progres {e.student.progresses.length}/{course.lessons.length} materi</small><small>Terdaftar {new Intl.DateTimeFormat('id-ID').format(e.enrolledAt)}</small></div>)}</div><div className="instructor-roster"><h2>Hasil kuis</h2>{attempts.length===0?<p>Belum ada hasil kuis.</p>:attempts.map(a=><div key={a.id}><strong>{a.student.fullName}</strong><small>{a.quizTitle}</small><b>{a.score}/100</b></div>)}</div></div></main>;
}
