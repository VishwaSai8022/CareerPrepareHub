import express from 'express';

import { forgotPassword, googleAuth, login, resetPassword, sendOtp, signup, verifyOtp } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  resetPasswordSchema,
  sendOtpSchema,
  signupSchema,
  verifyOtpSchema,
} from '../validation/auth.validation.js';

const router = express.Router();

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.post('/google', validateBody(googleAuthSchema), googleAuth);
router.post('/send-otp', validateBody(sendOtpSchema), sendOtp);
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtp);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);

export default router;
