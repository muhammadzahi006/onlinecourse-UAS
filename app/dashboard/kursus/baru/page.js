import Link from 'next/link';
import {redirect} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';
import {CourseEditor} from './form';

export default async function NewCoursePage(){const auth=await requireUser(['INSTRUCTOR','ADMIN']);if(auth.error)redirect('/login');const categories=await prisma.category.findMany({orderBy:{name:'asc'}});return <main className="learning-page"><header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></Link><Link className="text-link" href="/dashboard">← Dashboard</Link></header><div className="learning-content"><div className="eyebrow"><span className="eyebrow-line"/> RUANG PENGAJAR</div><h1>Buat kelas baru.</h1><p>Siapkan materi dan kuis. Kursus baru dimulai sebagai draft dan bisa dipublikasikan setelah siap.</p><CourseEditor categories={categories}/></div></main>}
