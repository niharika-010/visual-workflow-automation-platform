import express from 'express';
import cors from 'cors';
import { checkDatabaseConnection } from './config/db.js';
import { checkRedisConnection } from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import executionRoutes from './routes/execution.routes.js';
import credentialRoutes from './routes/credential.routes.js';
import { initScheduler } from './services/scheduler.service.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkDatabaseConnection();
  const redisStatus = await checkRedisConnection();

  const isHealthy = dbStatus.connected && redisStatus.connected;

  res.status(isHealthy ? 200 : 200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      api: { status: 'healthy', uptime: process.uptime() },
      database: dbStatus.connected
        ? { status: 'healthy', time: dbStatus.time }
        : { status: 'degraded', error: dbStatus.error, note: 'In-memory fallback active' },
      redis: redisStatus.connected
        ? { status: 'healthy' }
        : { status: 'degraded', error: redisStatus.error, note: 'Queue worker offline' },
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api', executionRoutes);

// Initialize Server-Side Cron Scheduler
initScheduler().catch((e) => console.warn('Scheduler init skipped:', e.message));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

export default app;
