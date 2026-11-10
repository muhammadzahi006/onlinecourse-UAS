const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const webpush = require('web-push');
const pino = require('pino');
const { PrismaClient } = require('@prisma/client');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const prisma = new PrismaClient();
if (!process.env.REDIS_URL || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) throw new Error('REDIS_URL dan kunci VAPID wajib dikonfigurasi.');
webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
const worker = new Worker('web-push', async job => {
  const notification = await prisma.notificationJob.findUnique({ where: { id: job.data.notificationId } });
  if (!notification) return;
  const subscriptions = await prisma.pushSubscription.findMany({ where: { profileId: notification.profileId } });
  for (const subscription of subscriptions) {
    try { await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: notification.title, body: notification.body, url: notification.url })); }
    catch (error) { if (error.statusCode === 404 || error.statusCode === 410) await prisma.pushSubscription.delete({ where: { id: subscription.id } }); else throw error; }
  }
  logger.info({ event: 'push_job_complete', jobId: job.id, subscriptions: subscriptions.length });
}, { connection: new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null }), concurrency: 5 });
worker.on('failed', (job,error)=>logger.error({event:'push_job_failed',jobId:job?.id,attempt:job?.attemptsMade,err:error}));
worker.on('error', error=>logger.error({event:'worker_error',err:error}));
process.on('SIGTERM', async()=>{await worker.close();await prisma.$disconnect();process.exit(0)});
