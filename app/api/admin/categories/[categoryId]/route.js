import {NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';
import {checkRateLimit} from '@/lib/rate-limit';

const schema=z.object({name:z.string().trim().min(2).max(80),slug:z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100)});
export async function PATCH(request,{params}){
  const auth=await requireUser(['ADMIN']);if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const limited=await checkRateLimit(auth.user.id,'admin-category-update',{limit:60,windowSeconds:3600});if(limited)return limited;
  const {categoryId}=await params;const id=z.string().uuid().safeParse(categoryId);if(!id.success)return NextResponse.json({error:'Kategori tidak valid.'},{status:400});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Nama atau slug kategori tidak valid.'},{status:400});
  try{const category=await prisma.category.update({where:{id:categoryId},data:parsed.data});return NextResponse.json({category});}
  catch(error){if(error.code==='P2025')return NextResponse.json({error:'Kategori tidak ditemukan.'},{status:404});if(error.code==='P2002')return NextResponse.json({error:'Nama atau slug kategori sudah digunakan.'},{status:409});return NextResponse.json({error:'Kategori belum berhasil diperbarui.'},{status:500});}
}
export async function DELETE(request,{params}){
  const auth=await requireUser(['ADMIN']);if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const limited=await checkRateLimit(auth.user.id,'admin-category-delete',{limit:30,windowSeconds:3600});if(limited)return limited;
  const {categoryId}=await params;const id=z.string().uuid().safeParse(categoryId);if(!id.success)return NextResponse.json({error:'Kategori tidak valid.'},{status:400});
  try{await prisma.category.delete({where:{id:categoryId}});return NextResponse.json({success:true});}
  catch(error){if(error.code==='P2003')return NextResponse.json({error:'Kategori masih dipakai kursus dan tidak dapat dihapus.'},{status:409});if(error.code==='P2025')return NextResponse.json({error:'Kategori tidak ditemukan.'},{status:404});return NextResponse.json({error:'Kategori belum berhasil dihapus.'},{status:500});}
}
