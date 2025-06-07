import { Router } from 'express';
import { getClient } from '../services/elasticsearch';
import { publishLog } from '../services/kafka';
import { authorize } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Get logs with filtering and pagination
router.get('/', authorize(['user', 'admin']), async (req, res) => {
  try {
    const { from = 0, size = 10, level, service, startDate, endDate } = req.query;

    const query: any = {
      bool: {
        must: []
      }
    };

    if (level) {
      query.bool.must.push({ match: { level } });
    }

    if (service) {
      query.bool.must.push({ match: { service } });
    }

    if (startDate && endDate) {
      query.bool.must.push({
        range: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });
    }

    const result = await getClient().search({
      index: 'logs',
      from: Number(from),
      size: Number(size),
      query,
      sort: [{ timestamp: 'desc' }]
    });

    res.json({
      total: result.hits.total,
      logs: result.hits.hits.map(hit => ({ id: hit._id, ...hit._source }))
    });
  } catch (error) {
    logger.error('Failed to fetch logs', { error });
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

// Ingest new log
router.post('/', authorize(['service', 'admin']), async (req, res) => {
  try {
    const logMessage = {
      ...req.body,
      timestamp: new Date()
    };

    await publishLog('logs', logMessage);
    res.status(201).json({ message: 'Log ingested successfully' });
  } catch (error) {
    logger.error('Failed to ingest log', { error });
    res.status(500).json({ message: 'Failed to ingest log' });
  }
});

export default router;

