import app from './app.js';
import { config } from './config/env.js';
import { checkDatabaseConnection, initDbTables } from './config/db.js';
import { checkRedisConnection } from './config/redis.js';

const startServer = async () => {
  console.log('🚀 Initializing Visual Workflow Automation Platform Backend (Phase 2 Auth)...');
  console.log(`Environment: ${config.nodeEnv}`);

  // Test optional connections on startup
  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.connected) {
    console.log('✅ PostgreSQL Connected successfully.');
    await initDbTables();
  } else {
    console.warn(`⚠️ PostgreSQL Warning: ${dbStatus.error} (Ensure docker container is running. Fallback repository enabled.)`);
  }

  const redisStatus = await checkRedisConnection();
  if (redisStatus.connected) {
    console.log('✅ Redis Connected successfully.');
  } else {
    console.warn(`⚠️ Redis Warning: ${redisStatus.error} (Ensure docker container is running)`);
  }

  app.listen(config.port, () => {
    console.log(`✨ Server is running on http://localhost:${config.port}`);
    console.log(`🩺 Health endpoint available at http://localhost:${config.port}/api/health`);
    console.log(`🔑 Auth endpoints available at http://localhost:${config.port}/api/auth/*`);
  });
};

startServer().catch((err) => {
  console.error('Fatal error during backend startup:', err);
  process.exit(1);
});
