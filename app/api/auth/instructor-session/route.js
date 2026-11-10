import {NextResponse} from 'next/server';
import {requireUser} from '@/lib/auth';

export async function GET(){
  const auth=await requireUser(['INSTRUCTOR']);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  return NextResponse.json({authorized:true});
}
