import { executeWorkflowGraph } from '../../../backend/src/workflows/executor/workflowExecutor.js';
import { getWorkflowByIdAndUserId } from '../../../backend/src/models/workflow.model.js';
import { updateExecutionRecord } from '../../../backend/src/models/execution.model.js';
import { dbPool } from '../../../backend/src/config/db.js';

export const processWorkflowJob = async (job) => {
  const { workflowId, executionId, inputData = {} } = job.data;
  console.log(`⚙️ [Worker] Processing job #${job.id} for Execution ID: ${executionId} (Attempt: ${job.attemptsMade + 1})`);

  let workflow = null;

  try {
    const client = await dbPool.connect();
    const result = await client.query(
      `SELECT id, user_id, name, description, status, workflow_json, version, created_at, updated_at
       FROM workflows
       WHERE id = $1`,
      [workflowId]
    );
    client.release();

    if (result.rows.length > 0) {
      workflow = result.rows[0];
    }
  } catch (err) {
    console.warn(`ℹ️ Worker DB query fallback for workflow ${workflowId}: ${err.message}`);
  }

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found in database`);
  }

  // Update status to 'running'
  await updateExecutionRecord(executionId, {
    status: 'running',
    outputData: {},
    error: null,
  });

  // Run graph execution engine
  const executionResult = await executeWorkflowGraph({
    workflow,
    initialData: inputData,
    existingExecutionId: executionId,
  });

  if (!executionResult.success) {
    throw new Error(executionResult.error || 'Workflow execution failed in worker processor');
  }

  console.log(`✅ [Worker] Successfully completed job #${job.id} for Execution ID: ${executionId}`);
  return executionResult;
};
