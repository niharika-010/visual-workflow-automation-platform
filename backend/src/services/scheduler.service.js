import cron from 'node-cron';
import { dbPool } from '../config/db.js';
import { createExecutionRecord } from '../models/execution.model.js';
import { enqueueWorkflowExecution } from '../config/queue.js';
import { executeWorkflowGraph } from '../workflows/executor/workflowExecutor.js';

const activeTasks = new Map(); // workflowId -> cron task instance

export const initScheduler = async () => {
  console.log('⏰ Initializing Workflow Cron & Interval Scheduler...');
  await syncScheduledJobs();
};

export const syncScheduledJobs = async () => {
  try {
    // Stop all current tasks
    for (const [wfId, task] of activeTasks.entries()) {
      task.stop();
    }
    activeTasks.clear();

    const client = await dbPool.connect();
    const result = await client.query(
      `SELECT id, name, workflow_json
       FROM workflows
       WHERE status = 'active'`
    );
    client.release();

    for (const wf of result.rows) {
      const json = typeof wf.workflow_json === 'string' ? JSON.parse(wf.workflow_json) : wf.workflow_json || {};
      const scheduleNode = (json.nodes || []).find((n) => {
        const type = n.data?.nodeType || n.type;
        return type === 'schedule';
      });

      if (scheduleNode) {
        const cronExpr = scheduleNode.data?.config?.cron || '*/15 * * * *';
        if (cron.validate(cronExpr)) {
          const task = cron.schedule(cronExpr, async () => {
            console.log(`⏰ [Scheduler] Triggering scheduled execution for Workflow "${wf.name}" (${wf.id})`);

            const initialData = {
              trigger: 'schedule',
              scheduledAt: new Date().toISOString(),
              cron: cronExpr,
            };

            const executionRecord = await createExecutionRecord({
              workflowId: wf.id,
              inputData: initialData,
              initialStatus: 'queued',
            });

            const enqueueRes = await enqueueWorkflowExecution({
              workflowId: wf.id,
              executionId: executionRecord.id,
              inputData: initialData,
            });

            if (!enqueueRes.queued) {
              await executeWorkflowGraph({
                workflow: wf,
                initialData,
                existingExecutionId: executionRecord.id,
              });
            }
          });

          activeTasks.set(wf.id, task);
          console.log(`   Registered Cron Schedule "${cronExpr}" for Workflow "${wf.name}"`);
        }
      }
    }
  } catch (err) {
    console.warn(`ℹ️ Scheduler sync skipped: ${err.message}`);
  }
};
