import Redis from 'ioredis';
import { config } from './env.js';

export const redisConnectionOptions = {
  host: config.redisHost,
  port: config.redisPort,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times > 2) return null;
    return Math.min(times * 200, 1000);
  },
};

export const redisClient = new Redis(config.redisUrl, {
  ...redisConnectionOptions,
  lazyConnect: true,
});

redisClient.on('error', (err) => {
  // Silent error handling for optional Redis connection check
});

export const checkRedisConnection = async () => {
  try {
    if (redisClient.status !== 'ready' && redisClient.status !== 'connecting') {
      await redisClient.connect();
    }
    const pong = await redisClient.ping();
    return {
      connected: pong === 'PONG',
      status: redisClient.status,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
};
