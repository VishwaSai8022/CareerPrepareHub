import Joi from 'joi';

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
  .messages({
    'string.pattern.base': 'password must include uppercase, lowercase, number and special character',
  });

export const signupSchema = Joi.object({
  firstname: Joi.string().trim().min(2).max(50).required(),
  middlename: Joi.string().trim().max(50).allow('').optional(),
  lastname: Joi.string().trim().min(1).max(50).required(),
  username: Joi.string().trim().lowercase().min(3).max(30).required(),
  email: Joi.string().trim().lowercase().email().required(),
  phone: Joi.string().trim().allow('').optional(),
  dob: Joi.string().required(),
  password: passwordSchema.required(),
  nationality: Joi.string().trim().required(),
  status: Joi.string().valid('Student', 'Employed', 'Unemployed').required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().optional(),
  identifier: Joi.string().trim().min(3).optional(),
  password: Joi.string().min(1).required(),
}).or('email', 'identifier');

export const googleAuthSchema = Joi.object({
  credential: Joi.string().trim().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
});

export const sendOtpSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  purpose: Joi.string().valid('signup', 'password_reset').default('password_reset'),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  otp: Joi.string().pattern(/^\d{6}$/).required(),
  purpose: Joi.string().valid('signup', 'password_reset').default('password_reset'),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  resetToken: Joi.string().trim().min(20).required(),
  password: passwordSchema.required(),
});
