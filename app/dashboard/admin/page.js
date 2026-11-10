import Link from 'next/link';
import {redirect} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';
import {AdminPanel} from './panel';

export default async function AdminPage(){
  const auth=await requireUser(['ADMIN']);if(auth.error)redirect('/admin/login');
  const [categories,users,courses]=await Promise.all([
    prisma.category.findMany({include:{_count:{select:{courses:true}}},orderBy:{name:'asc'}}),
    prisma.$queryRaw`SELECT p.id, p.full_name AS "fullName", p.role, p.created_at AS "createdAt", u.email FROM public.profiles p LEFT JOIN auth.users u ON u.id=p.id ORDER BY p.created_at DESC LIMIT 100`,
    prisma.course.findMany({select:{id:true,title:true,status:true,slug:true},orderBy:{createdAt:'desc'},take:20}),
  ]);
  return <main className="learning-page"><header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></Link><div className="dashboard-right"><span>Panel admin</span><Link href="/dashboard">Dashboard ↗</Link></div></header><div className="learning-content admin-content"><div className="eyebrow"><span className="eyebrow-line"/> PENGELOLAAN PLATFORM</div><h1>Ruang admin.</h1><p>Kelola role akun, kategori katalog, dan status publikasi kursus.</p><AdminPanel initialCategories={categories.map(c=>({...c,count:c._count.courses}))} initialUsers={users} courses={courses}/></div></main>;
}
