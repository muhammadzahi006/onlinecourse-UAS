import {NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';
import {logger} from '@/lib/logger';
import {checkRateLimit} from '@/lib/rate-limit';

const schema=z.object({title:z.string().trim().min(5).max(140),slug:z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),description:z.string().trim().min(20).max(3000),categoryId:z.string().uuid(),level:z.enum(['PEMULA','MENENGAH','LANJUTAN','SEMUA LEVEL']),price:z.number().int().min(0).max(100000000),lessons:z.array(z.string().trim().min(3).max(140)).min(1).max(80),question:z.string().trim().min(5).max(400),options:z.array(z.string().trim().min(1).max(200)).min(2).max(8),correctOption:z.number().int().min(0).max(7)}).refine(v=>v.correctOption<v.options.length,{path:['correctOption'],message:'Jawaban benar harus sesuai pilihan yang tersedia.'});

export async function POST(request) {
  const auth=await requireUser(['INSTRUCTOR','ADMIN']);if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const limited=await checkRateLimit(auth.user.id,'course-create',{limit:10,windowSeconds:3600});if(limited)return limited;
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Periksa kembali isian kursus.',details:parsed.error.flatten().fieldErrors},{status:400});
  const value=parsed.data;const category=await prisma.category.findUnique({where:{id:value.categoryId}});if(!category)return NextResponse.json({error:'Kategori tidak ditemukan.'},{status:400});
  try {
    const course=await prisma.$transaction(async tx=>{
      const created=await tx.course.create({data:{title:value.title,slug:value.slug,description:value.description,categoryId:value.categoryId,level:value.level,price:value.price,instructorId:auth.user.id,status:'DRAFT'}});
      await tx.lesson.createMany({data:value.lessons.map((title,index)=>({courseId:created.id,title,position:index+1}))});
      const quiz=await tx.quiz.create({data:{courseId:created.id,title:'Cek pemahaman',questions:[{question:value.question,options:value.options}]}});
      await tx.quizAnswer.create({data:{quizId:quiz.id,questionIndex:0,correctOption:value.correctOption}});
      return created;
    });
    return NextResponse.json({course},{status:201});
  } catch(error) { if(error.code==='P2002')return NextResponse.json({error:'Slug kursus sudah digunakan.'},{status:409});logger.error({err:error,event:'course_create_failed'});return NextResponse.json({error:'Kursus belum berhasil dibuat.'},{status:500}); }
}
