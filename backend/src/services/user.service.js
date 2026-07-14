import User from '../models/user.model.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeUsername = (username) => String(username || '').trim().toLowerCase();

export const findUserByEmail = (email) => User.findOne({ email: normalizeEmail(email) });
export const findUserByEmailWithPassword = (email) => User.findOne({ email: normalizeEmail(email) }).select('+password');
export const findUserByUsernameWithPassword = (username) => User.findOne({ username: normalizeUsername(username) }).select('+password');

export const findUserById = (id) => User.findById(id);

export const createUser = (payload) => User.create(payload);

export const upgradeUserToPremium = async (id) => {
  const user = await User.findById(id);
  if (!user) return null;

  user.isPremium = true;
  user.isPaid = true;
  await user.save();

  return user;
};

export const updatePasswordByEmail = async (email, newPassword) => {
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');
  if (!user) return null;

  user.password = newPassword;
  await user.save();
  return user;
};
