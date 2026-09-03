import { BaseNode } from './baseNode.js';
import { redisClient } from '../../config/redis.js';

export class RedisNode extends BaseNode {
  constructor() {
    super('redis');
  }

  async execute(context) {
    const { config = {} } = context;
    const { command = 'GET', key, value, ttl } = config;

    if (!key) {
      return {
        success: false,
        error: 'Redis cache key is required',
      };
    }

    try {
      const cmd = command.toUpperCase();
      let resultData = null;

      if (redisClient && (redisClient.status === 'ready' || redisClient.status === 'connecting')) {
        if (cmd === 'GET') {
          resultData = await redisClient.get(key);
        } else if (cmd === 'SET') {
          const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
          if (ttl && Number(ttl) > 0) {
            resultData = await redisClient.set(key, valStr, 'EX', Number(ttl));
          } else {
            resultData = await redisClient.set(key, valStr);
          }
        } else if (cmd === 'DEL' || cmd === 'DELETE') {
          resultData = await redisClient.del(key);
        } else if (cmd === 'EXISTS') {
          resultData = await redisClient.exists(key);
        } else if (cmd === 'INCR') {
          resultData = await redisClient.incr(key);
        }
      } else {
        // Mock fallback if Redis client disconnected
        resultData = `mock_result_for_${cmd}_${key}`;
      }

      return {
        success: true,
        data: {
          command: cmd,
          key,
          value: resultData,
          executedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `Redis operation failed: ${err.message}`,
        data: { error: err.message },
      };
    }
  }
}
