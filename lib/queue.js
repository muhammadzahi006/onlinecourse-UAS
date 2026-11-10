import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import {logger} from '@/lib/logger';

let queue;
export function getQueue() {
  if (!process.env.REDIS_URL) throw new Error('REDIS_URL belum dikonfigurasi');
  if (!queue) { const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null }); queue = new Queue('web-push', { connection, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 1000, removeOnFail: 5000 } }); }
  return queue;
}
export async function enqueueNotification(data) {
  const { prisma } = await import('@/lib/prisma');
  const job = await prisma.notificationJob.create({ data });
  try { await getQueue().add('send', { notificationId: job.id }, { jobId: job.id }); }
  catch (error) { logger.error({err:error,event:'push_job_queue_failed',jobId:job.id}); }
}
