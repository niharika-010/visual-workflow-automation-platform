import { Worker } from 'bullmq';
import { redisConnection } from './config/redis.js';
import { processWorkflowJob } from './processors/workflowProcessor.js';

const WORKFLOW_QUEUE_NAME = 'workflow-execution-queue';

console.log('🚀 Initializing Visual Workflow Automation Platform Worker Daemon...');

let worker = null;

try {
  worker = new Worker(
    WORKFLOW_QUEUE_NAME,
    async (job) => {
      return await processWorkflowJob(job);
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('ready', () => {
    console.log(`✨ Worker is ready & listening on queue "${WORKFLOW_QUEUE_NAME}"`);
  });

  worker.on('active', (job) => {
    console.log(`▶️ [BullMQ Job Active] Job #${job.id} started processing.`);
  });

  worker.on('completed', (job, result) => {
    console.log(`✅ [BullMQ Job Completed] Job #${job.id} finished successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [BullMQ Job Failed] Job #${job?.id} failed: ${err.message} (Attempts: ${job?.attemptsMade}/${job?.opts?.attempts || 3})`);
  });

  worker.on('error', (err) => {
    console.warn(`ℹ️ Worker Redis Connection Error: ${err.message} (Ensure Redis container is running on port 6379)`);
  });
} catch (err) {
  console.error('Failed to start worker daemon:', err);
}

// Graceful Shutdown
const shutdown = async () => {
  console.log('\n⏳ Shutting down worker daemon...');
  if (worker) {
    await worker.close();
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
