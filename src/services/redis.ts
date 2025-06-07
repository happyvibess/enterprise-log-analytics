import { createClient } from 'redis';
import config from '../config';
import logger from '../utils/logger';

let client: ReturnType<typeof createClient>;

export async function initializeRedis() {
  client = createClient({
    url: config.redis.url
  });

  client.on('error', (error) => {
    logger.error('Redis error', { error });
  });

  try {
    await client.connect();
    logger.info('Successfully connected to Redis');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    throw error;
  }
}

export async function cacheGet(key: string) {
  try {
    return await client.get(key);
  } catch (error) {
    logger.error('Failed to get from Redis cache', { error, key });
    throw error;
  }
}

export async function cacheSet(key: string, value: string, ttl?: number) {
  try {
    if (ttl) {
      await client.setEx(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  } catch (error) {
    logger.error('Failed to set Redis cache', { error, key });
    throw error;
  }
}

export function getClient() {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  return client;
}

