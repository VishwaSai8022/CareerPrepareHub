import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

import { env } from '../config/env.js';
import logger from '../logger/index.js';
import { ApiError } from '../middleware/error.middleware.js';
import Otp from '../models/otp.model.js';
import generateToken from '../utils/generateToken.js';
import { generateOtp, hashOtp } from '../utils/otpGenerator.js';
import { sendOtpEmail, sendResetOtpEmail } from './mail.service.js';
import {
  createUser,
  findUserByEmail,
  findUserByEmailWithPassword,
  findUserByUsernameWithPassword,
  updatePasswordByEmail,
} from './user.service.js';

const googleClient = new OAuth2Client(env.googleClientId);

const OTP_EMAIL_EXPIRY_MINUTES = 5;
const PASSWORD_RESET_SESSION_MINUTES = 10;
const SIGNUP_VERIFICATION_SESSION_MINUTES = 10;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeUsername = (username) => String(username || '').trim().toLowerCase();
const hashResetToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const buildOtpExpiry = (minutes = OTP_EMAIL_EXPIRY_MINUTES) => new Date(Date.now() + (minutes * 60 * 1000));

const ensureOtpRequestAllowed = (otpDoc) => {
  if (!otpDoc) return;

  const now = Date.now();
  if (otpDoc.lockedUntil && otpDoc.lockedUntil.getTime() > now) {
    throw new ApiError('Too many invalid OTP attempts. Try again later.', 429, 'OTP_LOCKED');
  }

  if (otpDoc.purpose === 'otp' && otpDoc.expiresAt.getTime() > now && otpDoc.otpHash) {
    throw new ApiError('An OTP was already sent recently. Please wait before requesting a new one.', 429, 'OTP_ALREADY_SENT');
  }
};

const getOtpOrThrow = async (email) => {
  const otpDoc = await Otp.findOne({ email });
  if (!otpDoc || otpDoc.purpose !== 'otp' || !otpDoc.otpHash) {
    throw new ApiError('OTP expired or invalid', 400, 'OTP_INVALID');
  }

  const now = Date.now();
  if (otpDoc.lockedUntil && otpDoc.lockedUntil.getTime() > now) {
    throw new ApiError('Too many invalid OTP attempts. Try again later.', 429, 'OTP_LOCKED');
  }

  if (otpDoc.expiresAt.getTime() < now) {
    await Otp.deleteOne({ email });
    throw new ApiError('OTP expired or invalid', 400, 'OTP_EXPIRED');
  }

  return otpDoc;
};

const getOtpForPurposeOrThrow = async (email, expectedPurpose) => {
  const otpDoc = await Otp.findOne({ email });
  if (!otpDoc || otpDoc.purpose !== expectedPurpose || !otpDoc.otpHash) {
    throw new ApiError('OTP expired or invalid', 400, 'OTP_INVALID');
  }

  const now = Date.now();
  if (otpDoc.lockedUntil && otpDoc.lockedUntil.getTime() > now) {
    throw new ApiError('Too many invalid OTP attempts. Try again later.', 429, 'OTP_LOCKED');
  }

  if (otpDoc.expiresAt.getTime() < now) {
    await Otp.deleteOne({ email });
    throw new ApiError('OTP expired or invalid', 400, 'OTP_EXPIRED');
  }

  return otpDoc;
};

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  firstname: user.firstname,
  middlename: user.middlename,
  lastname: user.lastname,
  username: user.username,
  email: user.email,
  phone: user.phone,
  dob: user.dob,
  profilePic: user.profilePic,
  googleId: user.googleId,
  authProvider: user.authProvider,
  nationality: user.nationality,
  status: user.status,
  isPaid: Boolean(user.isPaid || user.isPremium),
  isPremium: user.isPremium,
  role: user.role,
  createdAt: user.createdAt,
});

const splitName = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstname: 'Google', middlename: '', lastname: 'User' };
  }

  if (parts.length === 1) {
    return { firstname: parts[0], middlename: '', lastname: parts[0] };
  }

  return {
    firstname: parts[0],
    middlename: parts.slice(1, -1).join(' '),
    lastname: parts[parts.length - 1],
  };
};

const buildUsernameFromEmail = (email = '') => {
  const localPart = String(email).split('@')[0] || 'user';
  return localPart.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) || `user${Date.now()}`;
};

const buildUniqueUsername = async (seedValue) => {
  const base = normalizeUsername(seedValue).replace(/[^a-z0-9_]/g, '').slice(0, 24) || `user${Date.now()}`;
  let candidate = base;
  let suffix = 1;

  while (await findUserByUsernameWithPassword(candidate)) {
    candidate = `${base.slice(0, Math.max(1, 24 - String(suffix).length))}${suffix}`;
    suffix += 1;
  }

  return candidate;
};

export const signup = async ({ firstname, middlename, lastname, username, email, phone, dob, password, nationality, status }) => {
  const normalizedEmail = normalizeEmail(email);
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) throw new ApiError('Email already registered', 409, 'EMAIL_ALREADY_EXISTS');

  const signupVerification = await Otp.findOne({ email: normalizedEmail });
  if (
    !signupVerification
    || signupVerification.purpose !== 'signup_verified'
    || signupVerification.expiresAt.getTime() < Date.now()
  ) {
    throw new ApiError('Please verify your email before creating your account', 400, 'EMAIL_NOT_VERIFIED');
  }

  const normalizedUsername = await buildUniqueUsername(username);
  const fullName = [firstname, middlename, lastname].filter(Boolean).join(' ').trim();

  const user = await createUser({
    name: fullName,
    firstname: String(firstname).trim(),
    middlename: String(middlename || '').trim(),
    lastname: String(lastname).trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    phone: String(phone || '').trim(),
    dob,
    password,
    authProvider: 'local',
    nationality: String(nationality).trim(),
    status: String(status).trim(),
  });

  await Otp.deleteOne({ email: normalizedEmail });

  return {
    token: generateToken(user),
    user: toPublicUser(user),
  };
};

export const login = async ({ email, identifier, password }) => {
  const rawIdentifier = String(identifier || email || '').trim();
  const normalizedIdentifier = rawIdentifier.toLowerCase();
  const isEmailIdentifier = normalizedIdentifier.includes('@');

  const user = isEmailIdentifier
    ? await findUserByEmailWithPassword(normalizedIdentifier)
    : await findUserByUsernameWithPassword(normalizedIdentifier);

  if (!user) {
    logger.warn(`Failed login attempt: ${normalizedIdentifier}`);
    throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (user.authProvider === 'google' && !user.password) {
    throw new ApiError(
      'This account uses Google login. Continue with Google or set a password later.',
      403,
      'GOOGLE_ACCOUNT_PASSWORD_BLOCKED',
    );
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    logger.warn(`Failed login attempt: ${normalizedIdentifier}`);
    throw new ApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  logger.info(`Successful login: ${normalizedIdentifier}`);

  return {
    token: generateToken(user),
    user: toPublicUser(user),
  };
};

export const googleAuth = async ({ credential }) => {
  if (!env.googleClientId) {
    throw new ApiError(
      'Google authentication is not configured on the server. Add GOOGLE_CLIENT_ID to backend/.env.',
      500,
      'GOOGLE_AUTH_NOT_CONFIGURED',
    );
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.sub) {
    throw new ApiError('Invalid Google token payload', 401, 'INVALID_GOOGLE_TOKEN');
  }

  if (!payload.email_verified) {
    throw new ApiError('Google email is not verified', 401, 'GOOGLE_EMAIL_NOT_VERIFIED');
  }

  const email = normalizeEmail(payload.email);
  const fullName = String(payload.name || email.split('@')[0]).trim();
  const { firstname, middlename, lastname } = splitName(fullName);
  const profilePic = String(payload.picture || '').trim();

  let user = await findUserByEmail(email);
  let isNewUser = false;

  if (!user) {
    const username = await buildUniqueUsername(buildUsernameFromEmail(email));
    user = await createUser({
      name: fullName,
      firstname,
      middlename,
      lastname,
      username,
      email,
      password: null,
      googleId: payload.sub,
      profilePic,
      authProvider: 'google',
      nationality: '',
      status: 'Student',
    });
    isNewUser = true;
  } else {
    user.googleId = payload.sub;
    user.profilePic = profilePic || user.profilePic;
    if (!user.password) user.authProvider = 'google';
    user.name = user.name || fullName;
    user.firstname = user.firstname || firstname;
    user.middlename = user.middlename || middlename;
    user.lastname = user.lastname || lastname;
    await user.save();
  }

  logger.info(`Successful Google auth: ${email}`);

  return {
    token: generateToken(user),
    user: toPublicUser(user),
    isNewUser,
  };
};

export const forgotPassword = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  if (user) {
    const existingOtp = await Otp.findOne({ email: normalizedEmail });
    ensureOtpRequestAllowed(existingOtp);

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = buildOtpExpiry(env.otpExpiryMinutes);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        otpHash,
        resetTokenHash: null,
        purpose: 'otp',
        expiresAt,
        attempts: 0,
        lockedUntil: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await sendResetOtpEmail({ to: normalizedEmail, otp });
    logger.info(`Password reset OTP generated for ${normalizedEmail}`);
  }

  return {
    message: 'If the email exists, an OTP has been sent.',
  };
};

export const sendOtp = async ({ email, purpose = 'password_reset' }) => {
  const normalizedEmail = normalizeEmail(email);
  const otpPurpose = purpose === 'signup' ? 'signup' : 'otp';

  if (purpose === 'signup') {
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new ApiError('Email already registered', 409, 'EMAIL_ALREADY_EXISTS');
    }
  }

  const existingOtp = await Otp.findOne({ email: normalizedEmail });
  ensureOtpRequestAllowed(existingOtp);

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = buildOtpExpiry(OTP_EMAIL_EXPIRY_MINUTES);

  await Otp.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      otpHash,
      resetTokenHash: null,
        purpose: otpPurpose,
      expiresAt,
      attempts: 0,
      lockedUntil: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await sendOtpEmail({ to: normalizedEmail, otp, subject: 'Your OTP Code' });
  logger.info(`Authentication OTP generated for ${normalizedEmail}`);

  return {
    message: 'OTP sent successfully',
    expiresInSeconds: OTP_EMAIL_EXPIRY_MINUTES * 60,
  };
};

export const verifyOtp = async ({ email, otp, purpose = 'password_reset' }) => {
  const normalizedEmail = normalizeEmail(email);
  const otpDoc = purpose === 'signup'
    ? await getOtpForPurposeOrThrow(normalizedEmail, 'signup')
    : await getOtpOrThrow(normalizedEmail);
  const now = Date.now();

  const incomingHash = hashOtp(otp);
  if (incomingHash !== otpDoc.otpHash) {
    otpDoc.attempts += 1;
    if (otpDoc.attempts >= env.otpMaxAttempts) {
      otpDoc.lockedUntil = new Date(now + (env.otpLockMinutes * 60 * 1000));
    }
    await otpDoc.save();
    throw new ApiError('Invalid OTP', 400, 'OTP_INVALID');
  }

  if (purpose === 'signup') {
    otpDoc.otpHash = null;
    otpDoc.resetTokenHash = null;
    otpDoc.purpose = 'signup_verified';
    otpDoc.attempts = 0;
    otpDoc.lockedUntil = null;
    otpDoc.expiresAt = buildOtpExpiry(SIGNUP_VERIFICATION_SESSION_MINUTES);
    await otpDoc.save();

    return {
      message: 'Email verified successfully',
      verified: true,
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  otpDoc.otpHash = null;
  otpDoc.resetTokenHash = hashResetToken(resetToken);
  otpDoc.purpose = 'password_reset';
  otpDoc.attempts = 0;
  otpDoc.lockedUntil = null;
  otpDoc.expiresAt = buildOtpExpiry(PASSWORD_RESET_SESSION_MINUTES);
  await otpDoc.save();

  return {
    message: 'OTP verification successful',
    verified: true,
    resetToken,
  };
};

export const resetPassword = async ({ email, resetToken, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const otpDoc = await Otp.findOne({ email: normalizedEmail });

  if (!otpDoc || otpDoc.purpose !== 'password_reset' || !otpDoc.resetTokenHash) {
    logger.warn(`Reset password failed (reset session missing): ${normalizedEmail}`);
    throw new ApiError('Reset session expired or invalid', 400, 'RESET_SESSION_INVALID');
  }

  const now = Date.now();
  if (otpDoc.lockedUntil && otpDoc.lockedUntil.getTime() > now) {
    throw new ApiError('Too many invalid OTP attempts. Try again later.', 429, 'OTP_LOCKED');
  }

  if (otpDoc.expiresAt.getTime() < now) {
    await Otp.deleteOne({ email: normalizedEmail });
    throw new ApiError('Reset session expired or invalid', 400, 'RESET_SESSION_EXPIRED');
  }

  const incomingHash = hashResetToken(resetToken);
  if (incomingHash !== otpDoc.resetTokenHash) {
    await Otp.deleteOne({ email: normalizedEmail });
    throw new ApiError('Reset session expired or invalid', 400, 'RESET_SESSION_INVALID');
  }

  const updatedUser = await updatePasswordByEmail(normalizedEmail, password);
  if (!updatedUser) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  await Otp.deleteOne({ email: normalizedEmail });
  logger.info(`Password reset successful for ${normalizedEmail}`);

  return {
    message: 'Password reset successful',
  };
};
