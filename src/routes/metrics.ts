import { Router } from 'express';
import { getClient as getRedisClient } from '../services/redis';
import { authorize } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

router.get('/', authorize(['user', 'admin']), async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const metrics = [];
    const redisClient = getRedisClient();

    // Get metrics for the last N hours
    for (let i = 0; i < Number(hours); i++) {
      const date = new Date();
      date.setHours(date.getHours() - i);
      const hourKey = date.toISOString().slice(0, 13);

      const [errorCount, warningCount, infoCount] = await Promise.all([
        redisClient.get(`metrics:error:${hourKey}`),
        redisClient.get(`metrics:warn:${hourKey}`),
        redisClient.get(`metrics:info:${hourKey}`)
      ]);

      metrics.push({
        timestamp: date.toISOString(),
        errorCount: Number(errorCount || 0),
        warningCount: Number(warningCount || 0),
        infoCount: Number(infoCount || 0)
      });
    }

    res.json(metrics.reverse());
  } catch (error) {
    logger.error('Failed to fetch metrics', { error });
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

export default router;

