import { Router } from 'express';
import { checkDatabaseConnection } from '../config/db.js';
import { checkRedisConnection } from '../config/redis.js';

const router = Router();

/**
 * GET /api/health
 * Requirement 8:
 * Response:
 * {
 *   "status": "ok",
 *   "message": "Workflow Automation API is running"
 * }
 */
router.get('/health', async (req, res) => {
  const includeDetails = req.query.details === 'true';

  const baseResponse = {
    status: 'ok',
    message: 'Workflow Automation API is running',
  };

  if (includeDetails) {
    const dbStatus = await checkDatabaseConnection();
    const redisStatus = await checkRedisConnection();
    return res.status(200).json({
      ...baseResponse,
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json(baseResponse);
});

export default router;
