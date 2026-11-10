import Link from 'next/link';
import {redirect} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';

export default async function InstructorDashboard(){
  const auth=await requireUser(['INSTRUCTOR']);
  if(auth.error)redirect('/login');
  const courses=await prisma.course.findMany({
    where:{instructorId:auth.user.id},
    include:{_count:{select:{lessons:true,enrollments:true}}},
    orderBy:{createdAt:'desc'},
  });
  const studentCount=courses.reduce((total,course)=>total+course._count.enrollments,0);
  const publishedCount=courses.filter(course=>course.status==='PUBLISHED').length;
  return <main className="dashboard-page instructor-dashboard">
    <header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></Link><div className="dashboard-right"><span>{auth.profile.fullName}</span><form action="/auth/signout" method="post"><button className="signout">Keluar</button></form></div></header>
    <div className="dashboard-content">
      <div className="dashboard-welcome"><div><div className="eyebrow"><span className="eyebrow-line"/> RUANG PENGAJAR</div><h1>Dashboard pengajar.</h1><p>Kelola kelasmu dan ikuti perkembangan peserta.</p></div><div className="dashboard-actions"><Link className="button button-outline" href="/dashboard">Dashboard umum</Link><Link className="button button-dark" href="/dashboard/kursus/baru">Buat kursus <span>＋</span></Link></div></div>
      <div className="dashboard-stats"><div><span>KURSUS SAYA</span><strong>{courses.length}</strong></div><div><span>PESERTA TERDAFTAR</span><strong>{studentCount}</strong></div><div><span>KURSUS TERBIT</span><strong>{publishedCount}</strong></div></div>
      <div className="dashboard-title"><div><div className="eyebrow"><span className="eyebrow-line"/> KELAS YANG KAMU KELOLA</div><h2>Kursus saya.</h2></div></div>
      <div className="dashboard-course-grid">{courses.map(course=><article className="dashboard-course instructor-course-card" key={course.id}><span className="course-status">{course.status==='PUBLISHED'?'Terbit':course.status==='DRAFT'?'Draft':'Arsip'}</span><h3>{course.title}</h3><p>{course._count.enrollments} peserta · {course._count.lessons} materi</p><Link className="text-link" href={`/dashboard/kursus/${course.id}`}>Lihat progres dan nilai <span>→</span></Link></article>)}{courses.length===0&&<div className="dashboard-empty"><span>✳</span><h3>Belum ada kursus.</h3><p>Buat kursus pertama, tambahkan materi dan kuis, lalu publikasikan untuk peserta.</p><Link className="button button-dark" href="/dashboard/kursus/baru">Buat kursus <span>＋</span></Link></div>}</div>
    </div>
  </main>;
}
