import { Router } from 'express';
import logRoutes from './logs';
import metricsRoutes from './metrics';
import alertRoutes from './alerts';
import authRoutes from './auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use(authenticate);
router.use('/logs', logRoutes);
router.use('/metrics', metricsRoutes);
router.use('/alerts', alertRoutes);

export default router;

