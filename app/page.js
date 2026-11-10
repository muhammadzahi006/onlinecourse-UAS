import { prisma } from '@/lib/prisma';
import { CourseCard } from '@/components/course-card';
import {logger} from '@/lib/logger';
const symbols = { desain: '✳', teknologi: '⌘', bisnis: '↗', fotografi: '▤', 'pengembangan-diri': '◉' };

export default async function Home() {
  let courses = [], categories = [], learnerCount = 0, courseCount = 0;
  try {
    [courses, categories, learnerCount, courseCount] = await Promise.all([
      prisma.course.findMany({ where: { status: 'PUBLISHED' }, include: { category: true, instructor: true, _count: { select: { lessons: true, enrollments: true } } }, orderBy: { createdAt: 'desc' }, take: 3 }),
      prisma.category.findMany({ include: { _count: { select: { courses: true } } }, orderBy: { name: 'asc' }, take: 5 }),
      prisma.enrollment.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
    ]);
  } catch (error) { logger.error({err:error,event:'home_catalog_failed'}); }
  return <main>
    <div className="announcement"><span className="announce-dot" /> Belajar skill baru, buka peluang baru <a href="/kursus">Temukan kelasmu <span>→</span></a></div>
    <header className="nav wrap"><a className="brand" href="#"><span className="brand-mark">r.</span>ruang<span>belajar</span></a><nav><a href="/kursus">Jelajahi kelas</a><a href="#kategori">Kategori</a><a href="#cerita">Cerita belajar</a></nav><div className="nav-actions"><a className="login" href="/login">Masuk</a><a className="button button-dark button-small" href="/login?mode=signup">Mulai belajar <span>↗</span></a></div></header>

    <section className="hero wrap"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> PLATFORM BELAJAR ONLINE</div><h1>Belajar hal besar,<br/>mulai dari <em>sini.</em></h1><p className="hero-description">Satu langkah kecil hari ini bisa mengubah arah masa depanmu. Temukan kelas yang kamu suka, belajar dengan ahlinya.</p><div className="hero-buttons"><a className="button button-dark" href="#kelas">Jelajahi kelas <span>↗</span></a><a className="watch-link" href="#cerita"><span className="play">▶</span> Kenali RuangBelajar</a></div><div className="social-proof"><div className="avatars"><i>✳</i><i>⌘</i><i>↗</i></div><div><strong>{learnerCount} peserta</strong><span>mulai belajar di sini</span></div><div className="proof-divider"/><div><strong>{courseCount} kelas</strong><span>siap kamu jelajahi</span></div></div></div>
      <div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-sun"/><div className="art-caption"><span className="caption-icon">✳</span><div><small>SMALL STEPS, BIG THINGS</small><strong>Start where you are.</strong></div></div><div className="art-card art-card-top"><span className="card-icon">✦</span><div><small>KELAS PILIHAN</small><strong>Design your<br/>own future.</strong></div><span className="card-arrow">↗</span></div><div className="art-card art-card-bottom"><span className="mini-face">☺</span><div><strong>Belajar jadi lebih seru</strong><small>Bareng mentor favoritmu</small></div><span className="sound-bars">▂▅▃▇</span></div><div className="floating-star">✳</div><div className="floating-spark">✦</div></div>
    </section>

    <section className="category-section" id="kategori"><div className="wrap"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> MULAI DARI YANG KAMU SUKA</div><h2>Temukan <em>minatmu.</em></h2></div><a className="text-link" href="#kelas">Lihat semua kategori <span>→</span></a></div><div className="category-grid">{categories.map(category=><a className="category-tile" href="#kelas" key={category.id}><span className="category-icon">{symbols[category.slug] || '✳'}</span><strong>{category.name}</strong><small>{category._count.courses} kelas</small><span className="tile-arrow">↗</span></a>)}</div>{categories.length===0&&<p className="empty-note">Kategori akan tampil setelah katalog diinisialisasi.</p>}</div></section>

    <section className="courses wrap" id="kelas"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> PILIHAN UNTUKMU</div><h2>Kelas yang lagi <em>hangat.</em></h2></div><a className="text-link" href="/kursus">Jelajahi semua kelas <span>→</span></a></div><div className="course-grid">{courses.map((course,index)=><CourseCard course={course} index={index} key={course.id}/>)}</div>{courses.length===0&&<p className="empty-note">Belum ada kelas yang dipublikasikan. Kelas baru akan tampil di sini.</p>}</section>

    <section className="quote-section" id="cerita"><div className="quote-wrap"><span className="quote-mark">“</span><blockquote>Perjalanan baru tidak selalu dimulai dengan langkah besar. Cukup mulai dari hal yang membuatmu penasaran.</blockquote><div className="quote-person"><span className="quote-avatar">r.</span><span><strong>RuangBelajar</strong><small>Belajar hari ini, tumbuh setiap hari</small></span></div><div className="quote-decoration">✳</div></div></section>

    <section className="cta wrap"><div className="cta-spark">✳</div><div><span className="eyebrow">WAKTU TERBAIK UNTUK MULAI ADALAH SEKARANG</span><h2>Satu kelas bisa mengubah<br/>banyak hal. <em>Yuk, mulai!</em></h2></div><a className="button button-dark" href="/login?mode=signup">Cari kelas pertamamu <span>↗</span></a></section>
    <footer className="footer"><div className="wrap footer-inner"><a className="brand" href="#"><span className="brand-mark">r.</span>ruang<span>belajar</span></a><span>Belajar hari ini, jadi versi terbaik esok hari.</span><div><a href="#kelas">Kelas</a><a href="/login">Masuk</a><a href="mailto:halo@ruangbelajar.id">Kontak</a></div><small>© 2025 RuangBelajar</small></div></footer>
  </main>;
}
