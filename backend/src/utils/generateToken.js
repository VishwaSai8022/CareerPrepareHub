import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const generateToken = (user) => jwt.sign(
  {
    id: user._id,
    email: user.email,
    role: user.role,
    isPaid: Boolean(user.isPaid || user.isPremium),
    isPremium: Boolean(user.isPremium || user.isPaid),
  },
  env.jwtSecret,
  {
    expiresIn: env.jwtExpiresIn,
    algorithm: env.jwtAlgorithm,
  },
);

export default generateToken;
