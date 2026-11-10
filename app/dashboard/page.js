import Link from 'next/link';
import {redirect} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';
import {EnableNotifications} from './push-button';

export default async function Dashboard(){
  const auth=await requireUser();
  if(auth.error)redirect('/login');
  if(auth.profile.role==='INSTRUCTOR')redirect('/dashboard/pengajar');
  const isStudent=auth.profile.role==='STUDENT';
  const courses=isStudent
    ? await prisma.enrollment.findMany({where:{studentId:auth.user.id},include:{course:{include:{lessons:{select:{id:true}},_count:{select:{lessons:true}}}}},orderBy:{enrolledAt:'desc'}})
    : await prisma.course.findMany({where:auth.profile.role==='ADMIN'?{}:{instructorId:auth.user.id},include:{_count:{select:{lessons:true,enrollments:true}}},orderBy:{createdAt:'desc'}});
  const greeting=auth.profile.fullName.split(' ')[0];
  return <main className="dashboard-page">
    <header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></Link><div className="dashboard-right"><EnableNotifications/><span className="profile-chip">{greeting.slice(0,1).toUpperCase()}</span><span>{auth.profile.fullName}</span><form action="/auth/signout" method="post"><button className="signout">Keluar</button></form></div></header>
    <div className="dashboard-content">
      <div className="dashboard-welcome"><div><div className="eyebrow"><span className="eyebrow-line"/> RUANG BELAJARMU</div><h1>Halo, {greeting}. <em>Senang kamu di sini.</em></h1><p>{isStudent?'Sedikit demi sedikit, kamu sedang melangkah lebih jauh.':'Berikut ringkasan kelas dan peserta belajarmu.'}</p></div><div className="dashboard-actions">{auth.profile.role==='ADMIN'&&<Link className="button button-outline" href="/dashboard/admin">Panel admin <span>→</span></Link>}{auth.profile.role==='INSTRUCTOR'&&<Link className="button button-outline" href="/dashboard/kursus/baru">Buat kursus <span>＋</span></Link>}<Link className="button button-dark" href="/#kelas">Jelajahi kelas <span>↗</span></Link></div></div>
      <div className="dashboard-stats"><div><span>{isStudent?'KELAS DIIKUTI':'KELAS DIKELOLA'}</span><strong>{courses.length}</strong></div><div><span>PERAN AKUN</span><strong>{auth.profile.role==='STUDENT'?'Peserta':auth.profile.role==='INSTRUCTOR'?'Pengajar':'Admin'}</strong></div><div><span>LANGKAH KECIL</span><strong>🌱 Setiap hari</strong></div></div>
      <div className="dashboard-title"><div><div className="eyebrow"><span className="eyebrow-line"/> {isStudent?'LANJUTKAN PERJALANANMU':'KATALOG KELAS'}</div><h2>{isStudent?'Kelasmu.':'Kursus di platform.'}</h2></div></div>
      <div className="dashboard-course-grid">{courses.map(item=>{const course=isStudent?item.course:item;const total=isStudent?course.lessons.length:course._count.lessons;return <article className="dashboard-course" key={course.id}><span className="dashboard-course-symbol">✳</span><div className="course-category">{isStudent?'KELAS YANG KAMU IKUTI':`${course._count.enrollments} PESERTA · ${course._count.lessons} MATERI`}</div><h3>{course.title}</h3>{isStudent&&<p>{total} materi untuk kamu selesaikan.</p>}<Link className="text-link" href={isStudent?`/belajar/${course.id}`:`/dashboard/kursus/${course.id}`}>{isStudent?'Lanjut belajar':'Kelola kursus'} <span>→</span></Link></article>})}{courses.length===0&&<div className="dashboard-empty"><span>☼</span><h3>{isStudent?'Perjalanan belajarmu dimulai di sini.':'Belum ada kursus di dashboard.'}</h3><p>{isStudent?'Pilih kelas yang menarik perhatianmu, lalu mulai belajar dengan ritmemu sendiri.':'Buat kursus baru untuk menambahkan materi dan kuis.'}</p>{isStudent&&<Link className="button button-dark" href="/#kelas">Temukan kelas <span>↗</span></Link>}</div>}</div>
    </div>
  </main>;
}
