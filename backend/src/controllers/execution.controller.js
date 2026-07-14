import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { ApiError } from '../middleware/error.middleware.js';
import logger from '../logger/index.js';
import Submission from '../models/submission.model.js';
import { enqueueSubmission } from '../queue/queues.js';
import { buildSubmissionPayload, judgeSubmissionById } from '../services/execution/orchestrator.service.js';
import { diagnoseAndFix } from '../services/debugEngine.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

const ensureCode = (code) => {
  if (!String(code || '').trim()) {
    throw new ApiError('Code is required', 400, 'CODE_REQUIRED');
  }
};

export const runCode = asyncHandler(async (req, res) => {
  const { code, language, input = '', problemId = null } = req.body || {};
  ensureCode(code);

  const submission = await buildSubmissionPayload({
    userId: req.user?._id || null,
    problemId,
    language: String(language || '').trim().toLowerCase(),
    sourceCode: code,
    mode: 'run',
    customInput: String(input || ''),
  });

  const job = await enqueueSubmission(submission._id);
  submission.queueJobId = String(job.id);
  await submission.save();

  if (String(job.id).startsWith('local-')) {
    await judgeSubmissionById(submission._id);
    const updatedSubmission = await Submission.findById(submission._id).lean();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Run request executed in local fallback mode',
      data: updatedSubmission,
    });
  }

  return sendSuccess(res, {
    statusCode: 202,
    message: 'Run request queued successfully',
    data: {
      submissionId: submission._id,
      queueJobId: submission.queueJobId,
      status: submission.status,
    },
  });
});

export const submitCode = asyncHandler(async (req, res) => {
  const { code, language, problemId } = req.body || {};
  ensureCode(code);

  if (!problemId) {
    throw new ApiError('problemId is required', 400, 'PROBLEM_ID_REQUIRED');
  }

  const submission = await buildSubmissionPayload({
    userId: req.user?._id || null,
    problemId,
    language: String(language || '').trim().toLowerCase(),
    sourceCode: code,
    mode: 'submit',
  });

  const job = await enqueueSubmission(submission._id);
  submission.queueJobId = String(job.id);
  await submission.save();

  if (String(job.id).startsWith('local-')) {
    await judgeSubmissionById(submission._id);
    const updatedSubmission = await Submission.findById(submission._id).lean();
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Submission executed in local fallback mode',
      data: updatedSubmission,
    });
  }

  return sendSuccess(res, {
    statusCode: 202,
    message: 'Submission queued successfully',
    data: {
      submissionId: submission._id,
      queueJobId: submission.queueJobId,
      status: submission.status,
    },
  });
});

export const getSubmissionResult = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const submission = await Submission.findById(submissionId).lean();

  if (!submission) {
    throw new ApiError('Submission not found', 404, 'SUBMISSION_NOT_FOUND');
  }

  logger.info({ message: 'Fetched submission result', submissionId: String(submissionId), status: submission.status });

  return sendSuccess(res, {
    message: 'Submission fetched successfully',
    data: submission,
  });
});

export const debugCode = asyncHandler(async (req, res) => {
  const {
    code = '',
    language = '',
    stdin = '',
    expected_output: expectedOutput = '',
    actual_output: actualOutput = '',
    execution_result: executionResult = '',
    error_log: errorLog = '',
    status = '',
  } = req.body || {};

  if (!String(code).trim()) {
    throw new ApiError('Code is required for debugging', 400, 'CODE_REQUIRED');
  }

  if (!String(status).trim() && !String(errorLog).trim()) {
    throw new ApiError('Error status or error_log is required for debugging', 400, 'ERROR_CONTEXT_REQUIRED');
  }

  logger.info({
    message: 'Debug request received',
    language: String(language).trim().toLowerCase(),
    status,
    hasErrorLog: Boolean(errorLog),
  });

  const diagnosis = diagnoseAndFix({
    language,
    code,
    stdin,
    expectedOutput,
    actualOutput,
    executionResult,
    errorLog,
    status,
  });

  return sendSuccess(res, {
    message: 'Diagnosis completed successfully',
    data: diagnosis,
  });
});