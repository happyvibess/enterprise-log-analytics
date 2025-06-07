import { Router } from 'express';
import { getClient } from '../services/elasticsearch';
import { authorize } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

router.get('/', authorize(['user', 'admin']), async (req, res) => {
  try {
    const { from = 0, size = 10, severity } = req.query;

    const query: any = {
      bool: {
        must: []
      }
    };

    if (severity) {
      query.bool.must.push({ match: { severity } });
    }

    const result = await getClient().search({
      index: 'alerts',
      from: Number(from),
      size: Number(size),
      query,
      sort: [{ timestamp: 'desc' }]
    });

    res.json({
      total: result.hits.total,
      alerts: result.hits.hits.map(hit => ({ id: hit._id, ...hit._source }))
    });
  } catch (error) {
    logger.error('Failed to fetch alerts', { error });
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
});

export default router;

