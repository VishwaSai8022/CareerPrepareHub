import { env } from '../config/env.js';
import logger from '../logger/index.js';
import { getQueueBundle, getQueueConnection } from '../queue/queues.js';
import { handleSubmissionJob } from '../queue/jobHandlers.js';

let worker = null;

const startWorker = async () => {
  const queueBundle = await getQueueBundle();
  if (queueBundle.isFallback) {
    logger.warn({
      message: 'Submission worker not started because BullMQ/ioredis are unavailable. Install dependencies and start worker again.',
    });
    return;
  }

  const { Worker } = await import('bullmq');
  worker = new Worker(env.judgeQueueName, handleSubmissionJob, {
    connection: await getQueueConnection(),
    concurrency: env.judgeWorkerConcurrency,
  });

  worker.on('completed', (job, result) => {
    logger.info({
      message: 'Worker completed submission job',
      jobId: String(job.id),
      submissionId: String(job.data?.submissionId || ''),
      resultStatus: result?.status,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error({
      message: 'Worker failed submission job',
      jobId: String(job?.id || ''),
      submissionId: String(job?.data?.submissionId || ''),
      error: error.message,
    });
  });

  worker.on('error', (error) => {
    logger.error({ message: 'Submission worker error', error: error.message, stack: error.stack });
  });

  logger.info({ message: 'Submission worker started', concurrency: env.judgeWorkerConcurrency });
};

const shutdown = async (signal) => {
  logger.info({ message: 'Shutting down submission worker', signal });
  if (worker) await worker.close();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startWorker().catch((error) => {
  logger.error({ message: 'Failed to start submission worker', error: error.message, stack: error.stack });
  process.exit(1);
});