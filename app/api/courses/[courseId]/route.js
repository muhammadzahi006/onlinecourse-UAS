import {NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';
import {checkRateLimit} from '@/lib/rate-limit';

export async function PATCH(request,{params}) {
  const auth=await requireUser(['INSTRUCTOR','ADMIN']);if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const limited=await checkRateLimit(auth.user.id,'course-update',{limit:30,windowSeconds:3600});if(limited)return limited;
  const {courseId}=await params;const parsed=z.object({status:z.enum(['PUBLISHED','DRAFT'])}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Status kursus tidak valid.'},{status:400});
  const course=await prisma.course.findFirst({where:{id:courseId,...(auth.profile.role==='ADMIN'?{}:{instructorId:auth.user.id})},include:{lessons:true,quizzes:true}});if(!course)return NextResponse.json({error:'Kursus tidak ditemukan.'},{status:404});
  if(parsed.data.status==='PUBLISHED'&&(!course.title||course.description.length<20||course.lessons.length===0||course.quizzes.length===0))return NextResponse.json({error:'Kursus harus memiliki deskripsi, materi, dan kuis sebelum dipublikasikan.'},{status:422});
  const updated=await prisma.course.update({where:{id:course.id},data:{status:parsed.data.status}});return NextResponse.json({course:updated});
}
