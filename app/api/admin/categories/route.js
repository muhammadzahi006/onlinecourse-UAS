import {NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';
import {checkRateLimit} from '@/lib/rate-limit';

const schema=z.object({name:z.string().trim().min(2).max(80),slug:z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100)});
export async function POST(request){
  const auth=await requireUser(['ADMIN']);if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const limited=await checkRateLimit(auth.user.id,'admin-category-create',{limit:30,windowSeconds:3600});if(limited)return limited;
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Nama atau slug kategori tidak valid.'},{status:400});
  try{const category=await prisma.category.create({data:parsed.data});return NextResponse.json({category},{status:201});}
  catch(error){if(error.code==='P2002')return NextResponse.json({error:'Nama atau slug kategori sudah digunakan.'},{status:409});return NextResponse.json({error:'Kategori belum berhasil dibuat.'},{status:500});}
}
