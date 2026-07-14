import dotenv from 'dotenv';

dotenv.config();

const parseOrigins = (value = '') => value
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 10),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  otpLockMinutes: Number(process.env.OTP_LOCK_MINUTES || 15),
  emailUser: process.env.EMAIL_USER?.trim(),
  emailPass: process.env.EMAIL_PASS?.replace(/\s+/g, ''),
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  emailFrom: process.env.EMAIL_FROM || 'no-reply@careerprephub.com',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS || ''),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '100kb',
  logLevel: process.env.LOG_LEVEL || 'info',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  judgeQueueName: process.env.JUDGE_QUEUE_NAME || 'submission-judge',
  judgeWorkerConcurrency: Number(process.env.JUDGE_WORKER_CONCURRENCY || 2),
  judgeTimeoutMs: Number(process.env.JUDGE_TIMEOUT_MS || 5000),
  judgeMemoryMb: Number(process.env.JUDGE_MEMORY_MB || 256),
  judgeCpuCount: String(process.env.JUDGE_CPU_COUNT || '1'),
  judgeTmpFsMb: Number(process.env.JUDGE_TMPFS_MB || 64),
  judgeImageJava: process.env.JUDGE_IMAGE_JAVA || 'careerprephub/judge-java:latest',
  judgeImagePython: process.env.JUDGE_IMAGE_PYTHON || 'careerprephub/judge-python:latest',
  judgeImageCpp: process.env.JUDGE_IMAGE_CPP || 'careerprephub/judge-cpp:latest',
  judgeImageJavascript: process.env.JUDGE_IMAGE_JAVASCRIPT || 'careerprephub/judge-javascript:latest',
  judgeUseDocker: (process.env.JUDGE_USE_DOCKER || 'false').toLowerCase() === 'true',
});

const requiredVars = ['mongoUri', 'jwtSecret'];

export const validateEnv = () => {
  const missing = requiredVars.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
