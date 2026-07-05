import express from 'express';
import { createFoodPost, getAvailableFood, claimFood, getFoodForMap } from '../controllers/foodController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post('/create', protect, authorize('restaurant'), upload.single('image'), createFoodPost);
router.get('/available', protect, authorize('ngo'), getAvailableFood);
router.get('/map', protect, getFoodForMap);
router.put('/claim/:id', protect, authorize('ngo'), claimFood);

export default router;