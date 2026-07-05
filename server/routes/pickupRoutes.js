import express from 'express';
import { getProviderDashboard, getNgoDashboard, markDelivered } from '../controllers/pickupController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard/provider', protect, authorize('restaurant'), getProviderDashboard);
router.get('/dashboard/ngo', protect, authorize('ngo'), getNgoDashboard);
router.put('/deliver/:id', protect, authorize('ngo'), markDelivered);

export default router;