import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { enqueueNotification } from '@/lib/queue';
import {logger} from '@/lib/logger';
import {checkRateLimit} from '@/lib/rate-limit';

const schema = z.object({ courseId: z.string().uuid() });
export async function POST(request) {
  const auth = await requireUser(['STUDENT']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const limited=await checkRateLimit(auth.user.id,'enrollments',{limit:20,windowSeconds:60});if(limited)return limited;
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: 'Pilih kursus yang valid.' }, { status: 400 });
  const course = await prisma.course.findFirst({ where: { id: parsed.data.courseId, status: 'PUBLISHED' }, select: { id: true, title: true, instructorId: true } });
  if (!course) return NextResponse.json({ error: 'Kursus tidak ditemukan atau belum dipublikasikan.' }, { status: 404 });
  try {
    const enrollment = await prisma.enrollment.create({ data: { studentId: auth.user.id, courseId: course.id } });
    try { await enqueueNotification({ profileId: auth.user.id, title: 'Pendaftaran berhasil 🎉', body: `Kamu sudah terdaftar di ${course.title}. Yuk mulai belajar!`, url: `/belajar/${course.id}` }); } catch (error) { logger.error({err:error,event:'push_enqueue_failed'}); }
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Kamu sudah terdaftar di kursus ini.' }, { status: 409 });
    logger.error({err:error,event:'enrollment_failed'});
    return NextResponse.json({ error: 'Pendaftaran belum berhasil. Coba lagi.' }, { status: 500 });
  }
}
