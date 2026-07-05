import express from 'express';
import { register, login, logout, checkAuth, googleAuth, refreshToken, sendForgotOtp, resetPassword } from '../controllers/authController.js';
import { validateAuthInput } from '../middleware/validateMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', validateAuthInput, register);
router.post('/login', validateAuthInput, login);
router.post('/logout', logout);
router.get('/me', protect, checkAuth);
router.post('/refresh', refreshToken);
router.post('/google', googleAuth);
router.post('/forgot-otp', sendForgotOtp);
router.post('/reset-password', resetPassword);

export default router;