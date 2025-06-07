import './tracer'; // OpenTelemetry initialization
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { metricsMiddleware } from './middleware/metrics';
import routes from './routes';
import { initializeKafka } from './services/kafka';
import { initializeElasticsearch } from './services/elasticsearch';
import { initializeRedis } from './services/redis';
import logger from './utils/logger';
import config from './config';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Logging and monitoring
app.use(morgan('combined'));
app.use(metricsMiddleware);

// Body parsing
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services
async function initialize() {
  try {
    await Promise.all([
      initializeKafka(),
      initializeElasticsearch(),
      initializeRedis()
    ]);

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
}

initialize();

