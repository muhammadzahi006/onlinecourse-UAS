const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const categories = [
    ['Desain & Kreativitas','desain'], ['Teknologi','teknologi'], ['Bisnis & Karier','bisnis'], ['Fotografi','fotografi'], ['Pengembangan Diri','pengembangan-diri'],
  ];
  const instructors = [
    ['10000000-0000-4000-8000-000000000001','Nadia Putri'], ['10000000-0000-4000-8000-000000000002','Rizky Pratama'], ['10000000-0000-4000-8000-000000000003','Sarah Amelia'], ['10000000-0000-4000-8000-000000000004','Fajar Wibowo'], ['10000000-0000-4000-8000-000000000005','Dewi Lestari'],
  ];
  const students = [
    ['20000000-0000-4000-8000-000000000001','Alya Putri'], ['20000000-0000-4000-8000-000000000002','Bima Saputra'], ['20000000-0000-4000-8000-000000000003','Citra Maharani'], ['20000000-0000-4000-8000-000000000004','Dimas Prakoso'], ['20000000-0000-4000-8000-000000000005','Eka Lestari'],
  ];
  for (const [id, fullName] of instructors) await db.profile.upsert({ where: { id }, update: { fullName, role: 'INSTRUCTOR' }, create: { id, fullName, role: 'INSTRUCTOR' } });
  for (const [id, fullName] of students) await db.profile.upsert({ where: { id }, update: { fullName, role: 'STUDENT' }, create: { id, fullName, role: 'STUDENT' } });
  for (const [name, slug] of categories) await db.category.upsert({ where: { slug }, update: { name }, create: { name, slug } });
  const records = [
    ['ui-ux-dari-riset-sampai-prototype','UI/UX Design: Dari Riset sampai Prototype','Belajar merancang pengalaman digital dari riset pengguna hingga prototype interaktif.','PEMULA',149000,'desain','10000000-0000-4000-8000-000000000001'],
    ['web-development-react-nextjs','Web Development dengan React & Next.js','Bangun website modern dan responsif menggunakan React dan Next.js.','MENENGAH',199000,'teknologi','10000000-0000-4000-8000-000000000002'],
    ['digital-marketing-pemula','Strategi Digital Marketing untuk Pemula','Pahami strategi konten, iklan digital, dan analitik untuk bisnis.','PEMULA',129000,'bisnis','10000000-0000-4000-8000-000000000003'],
    ['fotografi-cerita-visual','Fotografi: Ceritakan Kisah lewat Gambar','Asah komposisi, cahaya, dan storytelling visual dengan kamera apa pun.','PEMULA',99000,'fotografi','10000000-0000-4000-8000-000000000004'],
    ['komunikasi-presentasi-percaya-diri','Komunikasi & Presentasi dengan Percaya Diri','Susun pesan dan presentasikan ide dengan lebih jelas dan meyakinkan.','SEMUA LEVEL',119000,'pengembangan-diri','10000000-0000-4000-8000-000000000005'],
  ];
  for (let i=0;i<records.length;i++) {
    const [slug,title,description,level,price,categorySlug,instructorId] = records[i];
    const category = await db.category.findUnique({ where: { slug: categorySlug } });
    const course = await db.course.upsert({ where: { slug }, update: {}, create: { slug,title,description,level,price,status:'PUBLISHED',categoryId:category.id,instructorId } });
    const lessons = ['Mulai di sini','Konsep dan dasar penting','Praktik langkah demi langkah','Proyek akhir dan rangkuman'];
    for (let j=0;j<lessons.length;j++) await db.lesson.upsert({ where: { courseId_position: { courseId: course.id, position: j+1 } }, update: {}, create: { courseId: course.id, title: lessons[j], position: j+1, contentText: `Materi ${j+1}: ${lessons[j]} — ${description}` } });
    const exists = await db.quiz.findFirst({ where: { courseId: course.id, title: 'Cek pemahaman' } });
    if (!exists) {
      const quiz = await db.quiz.create({ data: { courseId: course.id, title: 'Cek pemahaman', questions: [{ question: `Apa fokus utama kelas ${title}?`, options: ['Menerapkan konsep yang dipelajari','Menghafal tanpa praktik','Menghindari proses belajar'] }] } });
      await db.quizAnswer.create({ data: { quizId: quiz.id, questionIndex: 0, correctOption: 0 } });
    }
    const quiz = await db.quiz.findFirst({ where: { courseId: course.id }, include: { answerKeys: true } });
    const studentId = students[i][0];
    await db.enrollment.upsert({ where: { studentId_courseId: { studentId, courseId: course.id } }, update: {}, create: { studentId, courseId: course.id } });
    const firstLesson = await db.lesson.findUnique({ where: { courseId_position: { courseId: course.id, position: 1 } } });
    await db.lessonProgress.upsert({ where: { studentId_lessonId: { studentId, lessonId: firstLesson.id } }, update: {}, create: { studentId, lessonId: firstLesson.id } });
    const attemptExists = await db.quizAttempt.findFirst({ where: { studentId, quizId: quiz.id } });
    if (!attemptExists) await db.quizAttempt.create({ data: { studentId, quizId: quiz.id, answers: [i === 2 ? 1 : 0], score: i === 2 ? 0 : 100 } });
  }
  const [categoryCount,profileCount,courseCount,lessonCount,quizCount,enrollmentCount,progressCount,attemptCount] = await Promise.all([
    db.category.count(), db.profile.count(), db.course.count(), db.lesson.count(), db.quiz.count(),
    db.enrollment.count(), db.lessonProgress.count(), db.quizAttempt.count(),
  ]);
  console.log(JSON.stringify({event:'seed_complete',categories:categoryCount,profiles:profileCount,courses:courseCount,lessons:lessonCount,quizzes:quizCount,enrollments:enrollmentCount,progress:progressCount,quizAttempts:attemptCount}));
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect());
