import { getClient as getElasticsearchClient } from '../services/elasticsearch';
import { getClient as getRedisClient } from '../services/redis';
import logger from '../utils/logger';

export async function processLogMessage(message: any) {
  try {
    // Store in Elasticsearch
    await getElasticsearchClient().index({
      index: 'logs',
      document: {
        ...message,
        timestamp: new Date()
      }
    });

    // Update metrics in Redis
    const redisClient = getRedisClient();
    const currentHour = new Date().toISOString().slice(0, 13);
    const key = `metrics:${message.level}:${currentHour}`;

    await redisClient.incr(key);
    await redisClient.expire(key, 86400); // 24 hours

    // Check for alerts
    if (message.level === 'error') {
      await createAlert(message);
    }
  } catch (error) {
    logger.error('Failed to process log message', { error, message });
    throw error;
  }
}

async function createAlert(logMessage: any) {
  try {
    await getElasticsearchClient().index({
      index: 'alerts',
      document: {
        timestamp: new Date(),
        severity: 'high',
        message: logMessage.message,
        source: logMessage.service
      }
    });
  } catch (error) {
    logger.error('Failed to create alert', { error, logMessage });
    throw error;
  }
}

