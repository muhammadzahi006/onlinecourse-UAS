import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import {checkRateLimit} from '@/lib/rate-limit';

const schema = z.object({ endpoint: z.string().url().max(2048), keys: z.object({ p256dh: z.string().min(20).max(256), auth: z.string().min(10).max(128) }) });
export async function POST(request) {
  const auth = await requireUser();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const limited=await checkRateLimit(auth.user.id,'push-subscriptions',{limit:10,windowSeconds:3600});if(limited)return limited;
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: 'Subscription browser tidak valid.' }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  const existing=await prisma.pushSubscription.findUnique({where:{endpoint},select:{id:true,profileId:true}});
  if(existing&&existing.profileId!==auth.user.id)return NextResponse.json({error:'Subscription sudah terhubung ke akun lain.'},{status:409});
  try {
    if(existing)await prisma.pushSubscription.update({where:{id:existing.id},data:{p256dh:keys.p256dh,auth:keys.auth}});
    else await prisma.pushSubscription.create({data:{profileId:auth.user.id,endpoint,p256dh:keys.p256dh,auth:keys.auth}});
  } catch(error) { if(error.code==='P2002')return NextResponse.json({error:'Subscription sudah digunakan akun lain.'},{status:409});throw error; }
  return NextResponse.json({ success: true }, { status: existing?200:201 });
}
export async function DELETE(request) {
  const auth = await requireUser();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const limited=await checkRateLimit(auth.user.id,'push-subscriptions',{limit:10,windowSeconds:3600});if(limited)return limited;
  const parsed = z.object({ endpoint: z.string().url().max(2048) }).safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: 'Endpoint tidak valid.' }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, profileId: auth.user.id } });
  return NextResponse.json({ success: true });
}
