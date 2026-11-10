import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import {checkRateLimit} from '@/lib/rate-limit';

const schema = z.object({ lessonId: z.string().uuid() });
export async function POST(request) {
  const auth = await requireUser(['STUDENT']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const limited=await checkRateLimit(auth.user.id,'progress',{limit:40,windowSeconds:60});if(limited)return limited;
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: 'Materi tidak valid.' }, { status: 400 });
  const lesson = await prisma.lesson.findUnique({ where: { id: parsed.data.lessonId }, select: { id: true, courseId: true } });
  if (!lesson) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 });
  const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: auth.user.id, courseId: lesson.courseId } } });
  if (!enrollment) return NextResponse.json({ error: 'Daftar kursus ini terlebih dahulu.' }, { status: 403 });
  const progress = await prisma.lessonProgress.upsert({ where: { studentId_lessonId: { studentId: auth.user.id, lessonId: lesson.id } }, update: {}, create: { studentId: auth.user.id, lessonId: lesson.id } });
  return NextResponse.json({ progress });
}
