import { Queue } from 'bullmq';
import { redisConnectionOptions } from './redis.js';

export const WORKFLOW_QUEUE_NAME = 'workflow-execution-queue';

export let workflowQueue = null;

try {
  workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

  workflowQueue.on('error', (err) => {
    console.warn(`ℹ️ BullMQ Queue warning: ${err.message} (Using in-memory sync fallback if Redis offline)`);
  });

  console.log(`✅ BullMQ Queue "${WORKFLOW_QUEUE_NAME}" initialized.`);
} catch (error) {
  console.warn(`ℹ️ BullMQ Queue initialization skipped: ${error.message}`);
}

export const enqueueWorkflowExecution = async ({ workflowId, executionId, inputData = {} }) => {
  if (workflowQueue) {
    try {
      const job = await workflowQueue.add('execute-workflow', {
        workflowId,
        executionId,
        inputData,
      });
      return { queued: true, jobId: job.id };
    } catch (err) {
      console.warn(`ℹ️ Enqueue to Redis failed: ${err.message}. Falling back to sync execution.`);
      return { queued: false, error: err.message };
    }
  }
  return { queued: false, error: 'Redis queue unavailable' };
};
