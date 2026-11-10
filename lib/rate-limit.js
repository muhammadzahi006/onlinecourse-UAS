import {prisma} from '@/lib/prisma';

// PostgreSQL UPSERT makes each bucket update atomic across Next.js instances.
export async function checkRateLimit(subject,action,{limit,windowSeconds}) {
  const key=`${action}:${subject}`;
  const [bucket]=await prisma.$queryRaw`
    INSERT INTO public.rate_limit_buckets (bucket_key, hit_count, reset_at)
    VALUES (${key}, 1, now() + (${windowSeconds} * interval '1 second'))
    ON CONFLICT (bucket_key) DO UPDATE SET
      hit_count = CASE WHEN public.rate_limit_buckets.reset_at <= now() THEN 1 ELSE public.rate_limit_buckets.hit_count + 1 END,
      reset_at = CASE WHEN public.rate_limit_buckets.reset_at <= now() THEN now() + (${windowSeconds} * interval '1 second') ELSE public.rate_limit_buckets.reset_at END
    RETURNING hit_count, reset_at
  `;
  const retryAfter=Math.max(1,Math.ceil((new Date(bucket.reset_at).getTime()-Date.now())/1000));
  return bucket.hit_count<=limit?null:Response.json({error:'Terlalu banyak permintaan. Coba lagi sebentar.'},{status:429,headers:{'Retry-After':String(retryAfter)}});
}
