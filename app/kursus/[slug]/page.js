import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { JoinCourse } from './join-button';

export default async function CoursePage({params}) {
  const {slug}=await params;
  const course=await prisma.course.findFirst({where:{slug,status:'PUBLISHED'},include:{category:true,instructor:true,lessons:{orderBy:{position:'asc'},select:{id:true,title:true,position:true}},_count:{select:{enrollments:true}}}});
  if(!course)notFound();
  return <main className="course-detail-page"><header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></Link><Link href="/login">Masuk ↗</Link></header><div className="course-detail wrap"><div className="eyebrow"><span className="eyebrow-line"/> {course.category.name.toUpperCase()}</div><h1>{course.title}</h1><p className="course-detail-description">{course.description}</p><div className="detail-teacher"><span className="teacher-avatar">{course.instructor.fullName.split(' ').map(x=>x[0]).join('')}</span><div><small>DIAJAR OLEH</small><strong>{course.instructor.fullName}</strong></div></div><div className="course-detail-layout"><div><div className="detail-banner"><span>{course.category.name}</span><strong>Mulai dari<br/><em>rasa ingin tahu.</em></strong><i>✳</i></div><h2>Yang akan kamu pelajari</h2><div className="detail-list">{course.lessons.map((lesson,index)=><div key={lesson.id}><span>{String(index+1).padStart(2,'0')}</span>{lesson.title}<small>Materi</small></div>)}</div></div><aside className="enroll-panel"><div className="course-category">{course.level} · {course.lessons.length} MATERI</div><h2>{course.price===0?'Gratis':`Rp ${new Intl.NumberFormat('id-ID').format(course.price)}`}</h2><p>Belajar sesuai waktumu, akses materi setelah mendaftar.</p><JoinCourse courseId={course.id}/><div className="enroll-meta">✳ &nbsp;{course._count.enrollments} peserta sudah bergabung</div><div className="enroll-meta">▤ &nbsp;{course.lessons.length} materi pembelajaran</div></aside></div></div></main>;
}
