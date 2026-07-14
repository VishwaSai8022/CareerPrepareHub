import express from 'express';

import { debugCode, getSubmissionResult, runCode, submitCode } from '../controllers/execution.controller.js';

const router = express.Router();

router.post('/run', runCode);
router.post('/submit', submitCode);
router.post('/debug', debugCode);
router.get('/submissions/:submissionId', getSubmissionResult);

export default router;