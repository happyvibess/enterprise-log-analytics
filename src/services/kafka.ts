import { Kafka, Producer, Consumer } from 'kafkajs';
import config from '../config';
import logger from '../utils/logger';
import { processLogMessage } from '../processors/logProcessor';

let producer: Producer;
let consumer: Consumer;

export async function initializeKafka() {
  const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers
  });

  producer = kafka.producer();
  consumer = kafka.consumer({ groupId: 'log-analytics-group' });

  try {
    await producer.connect();
    await consumer.connect();

    // Subscribe to topics
    await consumer.subscribe({ topic: 'logs', fromBeginning: true });

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (message.value) {
          const logMessage = JSON.parse(message.value.toString());
          await processLogMessage(logMessage);
        }
      }
    });

    logger.info('Successfully connected to Kafka');
  } catch (error) {
    logger.error('Failed to connect to Kafka', { error });
    throw error;
  }
}

export async function publishLog(topic: string, message: any) {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
  } catch (error) {
    logger.error('Failed to publish message to Kafka', { error, topic, message });
    throw error;
  }
}

export function getProducer() {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }
  return producer;
}

export function getConsumer() {
  if (!consumer) {
    throw new Error('Kafka consumer not initialized');
  }
  return consumer;
}

