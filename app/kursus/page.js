import Link from 'next/link';
import {prisma} from '@/lib/prisma';
import {CourseCard} from '@/components/course-card';

const PAGE_SIZE=9;
export default async function CatalogPage({searchParams}) {
  const params=await searchParams;const query=String(params?.q||'').trim().slice(0,100);const selected=String(params?.kategori||'').slice(0,80);const current=Math.max(1,Math.min(10000,Number.parseInt(params?.page||'1',10)||1));
  const category=selected?await prisma.category.findUnique({where:{slug:selected},select:{id:true}}):null;
  const where={status:'PUBLISHED',...(query?{OR:[{title:{contains:query,mode:'insensitive'}},{description:{contains:query,mode:'insensitive'}},{instructor:{fullName:{contains:query,mode:'insensitive'}}}]}:{}),...(category?{categoryId:category.id}:selected?{id:'00000000-0000-4000-8000-000000000000'}:{})};
  const [courses,total,categories]=await Promise.all([
    prisma.course.findMany({where,include:{category:true,instructor:true,_count:{select:{lessons:true,enrollments:true}}},orderBy:{createdAt:'desc'},skip:(current-1)*PAGE_SIZE,take:PAGE_SIZE}),
    prisma.course.count({where}),
    prisma.category.findMany({where:{courses:{some:{status:'PUBLISHED'}}},orderBy:{name:'asc'}}),
  ]);
  const pages=Math.ceil(total/PAGE_SIZE);const pageHref=page=>`/kursus?${new URLSearchParams({...(query?{q:query}:{}),...(selected?{kategori:selected}:{}),page:String(page)})}`;
  return <main className="catalog-page"><header className="dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">r.</span>ruang<span>belajar</span></Link><Link href="/login">Masuk ↗</Link></header><section className="catalog-content wrap"><div className="eyebrow"><span className="eyebrow-line"/> PILIH JALAN BELAJARMU</div><h1>Semua <em>kelas.</em></h1><p>Temukan kelas yang pas dengan rasa ingin tahumu hari ini.</p><form className="catalog-filter" action="/kursus" method="get"><label className="catalog-search"><span>⌕</span><input name="q" type="search" maxLength="100" placeholder="Cari kelas, topik, atau pengajar…" defaultValue={query}/></label><select name="kategori" defaultValue={selected}><option value="">Semua kategori</option>{categories.map(c=><option value={c.slug} key={c.id}>{c.name}</option>)}</select><button className="button button-dark" type="submit">Cari kelas <span>↗</span></button></form><div className="catalog-results"><span>{total} kelas ditemukan</span>{query&&<span>untuk “{query}”</span>}</div>{courses.length?<div className="course-grid catalog-grid">{courses.map((course,index)=><CourseCard course={course} index={index} key={course.id}/>)}</div>:<div className="catalog-empty"><span>⌕</span><h2>Belum ada kelas yang cocok.</h2><p>Coba kata pencarian lain atau pilih kategori yang berbeda.</p><Link href="/kursus" className="text-link">Lihat semua kelas →</Link></div>}{pages>1&&<nav className="pagination" aria-label="Halaman katalog">{current>1?<Link href={pageHref(current-1)}>← Sebelumnya</Link>:<span/>}<span>Halaman {current} dari {pages}</span>{current<pages?<Link href={pageHref(current+1)}>Berikutnya →</Link>:<span/>}</nav>}</section></main>;
}
