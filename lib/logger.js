import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  redact: { paths: ['password', 'token', 'authorization', 'cookie', 'VAPID_PRIVATE_KEY'], censor: '[REDACTED]' },
});
