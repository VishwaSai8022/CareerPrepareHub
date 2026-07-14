import asyncHandler from '../middleware/asyncHandler.middleware.js';
import generateToken from '../utils/generateToken.js';
import { findUserById, upgradeUserToPremium } from '../services/user.service.js';
import { ApiError } from '../middleware/error.middleware.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  return sendSuccess(res, {
    message: 'User profile fetched successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      isPaid: Boolean(user.isPaid || user.isPremium),
      isPremium: Boolean(user.isPremium || user.isPaid),
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

export const upgradePremium = asyncHandler(async (req, res) => {
  const user = await upgradeUserToPremium(req.user.id);
  if (!user) throw new ApiError('User not found', 404, 'USER_NOT_FOUND');

  return sendSuccess(res, {
    message: 'Premium upgrade completed successfully',
    data: {
      token: generateToken(user),
      user: {
        id: user._id,
        firstname: user.firstname,
        middlename: user.middlename,
        lastname: user.lastname,
        username: user.username,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        nationality: user.nationality,
        status: user.status,
        isPaid: true,
        isPremium: true,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
  });
});