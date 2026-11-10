import {NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {requireUser} from '@/lib/auth';
import {checkRateLimit} from '@/lib/rate-limit';

export async function PATCH(request,{params}){
  const auth=await requireUser(['ADMIN']);if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const limited=await checkRateLimit(auth.user.id,'admin-user-role',{limit:60,windowSeconds:3600});if(limited)return limited;
  const {userId}=await params;const id=z.string().uuid().safeParse(userId);if(!id.success)return NextResponse.json({error:'Pengguna tidak valid.'},{status:400});
  const parsed=z.object({role:z.enum(['STUDENT','INSTRUCTOR','ADMIN'])}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Role pengguna tidak valid.'},{status:400});
  try{
    const profile=await prisma.$transaction(async tx=>{
      const target=await tx.profile.findUnique({where:{id:userId}});if(!target)return null;
      if(target.id===auth.user.id&&parsed.data.role!=='ADMIN')throw new Error('SELF_DEMOTION');
      if(target.role==='ADMIN'&&parsed.data.role!=='ADMIN'&&await tx.profile.count({where:{role:'ADMIN'}})<=1)throw new Error('LAST_ADMIN');
      return tx.profile.update({where:{id:userId},data:{role:parsed.data.role},select:{id:true,fullName:true,role:true,createdAt:true}});
    },{isolationLevel:'Serializable'});
    if(!profile)return NextResponse.json({error:'Pengguna tidak ditemukan.'},{status:404});
    return NextResponse.json({profile});
  }catch(error){
    if(error.message==='SELF_DEMOTION')return NextResponse.json({error:'Role akun admin yang sedang digunakan tidak dapat diturunkan.'},{status:409});
    if(error.message==='LAST_ADMIN')return NextResponse.json({error:'Sistem harus selalu memiliki setidaknya satu admin.'},{status:409});
    if(error.code==='P2034')return NextResponse.json({error:'Perubahan role bertabrakan dengan permintaan lain. Coba lagi.'},{status:409});
    return NextResponse.json({error:'Role pengguna belum berhasil diperbarui.'},{status:500});
  }
}
