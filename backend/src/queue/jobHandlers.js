import logger from '../logger/index.js';
import { judgeSubmissionById } from '../services/execution/orchestrator.service.js';

export const handleSubmissionJob = async (job) => {
  const submissionId = String(job?.data?.submissionId || '');
  logger.info({ message: 'Started submission job', submissionId, jobId: String(job.id) });

  try {
    const result = await judgeSubmissionById(submissionId);
    logger.info({
      message: 'Completed submission job',
      submissionId,
      jobId: String(job.id),
      finalStatus: result?.status,
    });
    return result;
  } catch (error) {
    logger.error({
      message: 'Submission job failed',
      submissionId,
      jobId: String(job.id),
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};