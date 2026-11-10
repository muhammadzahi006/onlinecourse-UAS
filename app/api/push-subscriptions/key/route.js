import { NextResponse } from 'next/server';
export async function GET() {
  if (!process.env.VAPID_PUBLIC_KEY) return NextResponse.json({ error: 'Notifikasi belum dikonfigurasi.' }, { status: 503 });
  return NextResponse.json({ key: process.env.VAPID_PUBLIC_KEY });
}
