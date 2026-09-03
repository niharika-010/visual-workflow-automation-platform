import { Worker } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';

export const WORKFLOW_QUEUE_NAME = 'workflow-execution-queue';

export const createWorkflowWorker = () => {
  console.log('⚡ Initializing BullMQ Workflow Worker...');

  const worker = new Worker(
    WORKFLOW_QUEUE_NAME,
    async (job) => {
      console.log(`[Worker] Processing execution job ${job.id} for workflow: ${job.data.workflowId}`);
      
      // Phase 1 placeholder: execution engine logic to be built in Phase 2
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        status: 'completed',
        jobId: job.id,
        workflowId: job.data.workflowId,
        executedAt: new Date().toISOString(),
      };
    },
    {
      connection: redisConnectionOptions,
      concurrency: 5,
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed successfully:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
  });

  return worker;
};
