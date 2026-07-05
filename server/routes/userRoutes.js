import express from 'express';
import { updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

// single('avatar') — accepts one image file with field name "avatar"
router.put('/profile', protect, upload.single('avatar'), updateProfile);

export default router;