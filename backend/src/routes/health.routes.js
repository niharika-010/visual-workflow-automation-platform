import { Router } from 'express';
import { checkDatabaseConnection, pool } from '../config/db.js';
import { checkRedisConnection, redisClient } from '../config/redis.js';
import { workflowQueue, WORKFLOW_QUEUE_NAME, enqueueWorkflowExecution } from '../config/queue.js';

const router = Router();

/**
 * GET /api/health
 */
router.get('/health', async (req, res) => {
  const includeDetails = req.query.details === 'true';
  const startTime = Date.now();

  const baseResponse = {
    status: 'ok',
    message: 'Workflow Automation API is running',
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
  };

  if (includeDetails) {
    const dbStart = Date.now();
    const dbStatus = await checkDatabaseConnection();
    const dbLatencyMs = Date.now() - dbStart;

    const redisStart = Date.now();
    const redisStatus = await checkRedisConnection();
    const redisLatencyMs = Date.now() - redisStart;

    let queueStats = {
      name: WORKFLOW_QUEUE_NAME,
      connected: !!redisStatus.connected,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };

    if (workflowQueue && redisStatus.connected) {
      try {
        const counts = await workflowQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
        queueStats = {
          ...queueStats,
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
        };
      } catch (err) {
        console.warn('Could not fetch queue counts:', err.message);
      }
    }

    const memoryUsage = process.memoryUsage();
    const formattedMemory = {
      heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
    };

    return res.status(200).json({
      ...baseResponse,
      services: {
        database: {
          ...dbStatus,
          latencyMs: dbLatencyMs,
        },
        redis: {
          ...redisStatus,
          latencyMs: redisLatencyMs,
        },
        queue: queueStats,
      },
      system: {
        memory: formattedMemory,
        apiLatencyMs: Date.now() - startTime,
      },
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json(baseResponse);
});

/**
 * POST /api/health/test-worker
 * Dispatches a test payload into BullMQ Queue to verify real-time worker execution
 */
router.post('/health/test-worker', async (req, res) => {
  try {
    const testExecutionId = `test_exec_${Date.now()}`;
    const result = await enqueueWorkflowExecution({
      workflowId: 'test-health-check-workflow',
      executionId: testExecutionId,
      inputData: { testTrigger: true, timestamp: new Date().toISOString() },
    });

    return res.status(200).json({
      status: 'success',
      message: result.queued
        ? 'Test job successfully enqueued into BullMQ Queue'
        : 'Worker queue fallback triggered (Redis in fallback mode)',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to dispatch test job to BullMQ queue',
    });
  }
});

export default router;
