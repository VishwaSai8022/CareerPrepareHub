import asyncHandler from '../middleware/asyncHandler.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as authService from '../services/auth.service.js';

export const signup = asyncHandler(async (req, res) => {
  const data = await authService.signup(req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Signup successful',
    data,
  });
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  return sendSuccess(res, {
    message: 'Login successful',
    data,
  });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const data = await authService.googleAuth(req.body);
  return sendSuccess(res, {
    message: data.isNewUser ? 'Google signup successful' : 'Google login successful',
    data,
  });
});

export const sendOtp = asyncHandler(async (req, res) => {
  const data = await authService.sendOtp(req.body);
  return sendSuccess(res, {
    message: data.message,
    data,
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const data = await authService.verifyOtp(req.body);
  return sendSuccess(res, {
    message: data.message,
    data,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body);
  return sendSuccess(res, {
    message: data.message,
    data: null,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return sendSuccess(res, {
    message: 'Password reset successful',
    data: null,
  });
});
