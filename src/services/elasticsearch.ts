import { Client } from '@elastic/elasticsearch';
import config from '../config';
import logger from '../utils/logger';

let client: Client;

export async function initializeElasticsearch() {
  client = new Client({
    node: config.elasticsearch.url,
    auth: config.elasticsearch.username ? {
      username: config.elasticsearch.username,
      password: config.elasticsearch.password!
    } : undefined
  });

  try {
    await client.ping();
    logger.info('Successfully connected to Elasticsearch');

    // Create indices if they don't exist
    await createIndices();
  } catch (error) {
    logger.error('Failed to connect to Elasticsearch', { error });
    throw error;
  }
}

async function createIndices() {
  const indices = ['logs', 'metrics', 'alerts'];

  for (const index of indices) {
    const exists = await client.indices.exists({ index });
    
    if (!exists) {
      await client.indices.create({
        index,
        mappings: getMapping(index)
      });
      logger.info(`Created index: ${index}`);
    }
  }
}

function getMapping(index: string) {
  switch (index) {
    case 'logs':
      return {
        properties: {
          timestamp: { type: 'date' },
          level: { type: 'keyword' },
          message: { type: 'text' },
          service: { type: 'keyword' },
          metadata: { type: 'object' }
        }
      };
    case 'metrics':
      return {
        properties: {
          timestamp: { type: 'date' },
          name: { type: 'keyword' },
          value: { type: 'float' },
          tags: { type: 'keyword' }
        }
      };
    case 'alerts':
      return {
        properties: {
          timestamp: { type: 'date' },
          severity: { type: 'keyword' },
          message: { type: 'text' },
          source: { type: 'keyword' }
        }
      };
    default:
      return {};
  }
}

export function getClient() {
  if (!client) {
    throw new Error('Elasticsearch client not initialized');
  }
  return client;
}

