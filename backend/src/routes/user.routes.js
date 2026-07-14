import express from 'express';

import { getProfile, upgradePremium } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.post('/upgrade', protect, upgradePremium);

export default router;