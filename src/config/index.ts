import { config } from 'dotenv';
import { z } from 'zod';

config();

const configSchema = z.object({
  port: z.number().default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  elasticsearch: z.object({
    url: z.string().url(),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  redis: z.object({
    url: z.string().url(),
  }),
  kafka: z.object({
    brokers: z.array(z.string()),
    clientId: z.string().default('log-analytics'),
  }),
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.string().default('1d'),
  }),
});

const processedConfig = configSchema.parse({
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL,
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || '').split(','),
    clientId: process.env.KAFKA_CLIENT_ID,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
});

export default processedConfig;

