import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import {checkRateLimit} from '@/lib/rate-limit';

const schema = z.object({ quizId: z.string().uuid(), answers: z.array(z.number().int().min(0).max(20)).min(1).max(50) });
export async function POST(request) {
  const auth = await requireUser(['STUDENT']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const limited=await checkRateLimit(auth.user.id,'quiz-submit',{limit:20,windowSeconds:60});if(limited)return limited;
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: 'Jawaban kuis tidak valid.' }, { status: 400 });
  const quiz = await prisma.quiz.findUnique({ where: { id: parsed.data.quizId }, include: { answerKeys: true } });
  if (!quiz || !Array.isArray(quiz.questions)) return NextResponse.json({ error: 'Kuis tidak ditemukan.' }, { status: 404 });
  const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: auth.user.id, courseId: quiz.courseId } } });
  if (!enrollment) return NextResponse.json({ error: 'Daftar kursus ini terlebih dahulu.' }, { status: 403 });
  const questions = quiz.questions;
  if (parsed.data.answers.length !== questions.length || questions.some((q,i)=>!Array.isArray(q.options)||parsed.data.answers[i]>=q.options.length)) return NextResponse.json({ error: 'Jumlah atau pilihan jawaban tidak sesuai kuis.' }, { status: 400 });
  const correct = questions.filter((q,i)=>parsed.data.answers[i]===quiz.answerKeys.find(key=>key.questionIndex===i)?.correctOption).length;
  const attempt = await prisma.quizAttempt.create({ data: { studentId: auth.user.id, quizId: quiz.id, answers: parsed.data.answers, score: Math.round(correct * 100 / questions.length) } });
  return NextResponse.json({ score: attempt.score, submittedAt: attempt.submittedAt }, { status: 201 });
}
