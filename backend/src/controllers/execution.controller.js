import { getWorkflowByIdAndUserId, getWorkflowsByUserId } from '../models/workflow.model.js';
import {
  createExecutionRecord,
  getExecutionsByWorkflowId,
  getExecutionById as getExecutionByIdModel,
} from '../models/execution.model.js';
import { enqueueWorkflowExecution } from '../config/queue.js';
import { executeWorkflowGraph } from '../workflows/executor/workflowExecutor.js';
import { dbPool } from '../config/db.js';

/**
 * POST /api/workflows/:id/execute
 * Manual Execution Trigger (Enqueues job to BullMQ queue)
 */
export const executeWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const inputData = req.body || {};

    const workflow = await getWorkflowByIdAndUserId(id, userId);
    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found or access denied',
      });
    }

    // Create execution record in database with queued status
    const executionRecord = await createExecutionRecord({
      workflowId: workflow.id,
      inputData,
      initialStatus: 'queued',
    });

    // Enqueue job to BullMQ Queue
    const enqueueResult = await enqueueWorkflowExecution({
      workflowId: workflow.id,
      executionId: executionRecord.id,
      inputData,
    });

    if (enqueueResult.queued) {
      return res.status(200).json({
        status: 'success',
        message: 'Workflow execution queued',
        executionId: executionRecord.id,
        executionStatus: 'queued',
        jobId: enqueueResult.jobId,
      });
    }

    // Fallback: If Redis queue unavailable, execute synchronously inline
    const syncResult = await executeWorkflowGraph({
      workflow,
      initialData: inputData,
      existingExecutionId: executionRecord.id,
    });

    return res.status(200).json({
      status: syncResult.success ? 'success' : 'error',
      message: syncResult.success ? 'Workflow executed synchronously (fallback)' : 'Workflow execution failed',
      executionId: syncResult.executionId,
      executionStatus: syncResult.status,
      outputs: syncResult.outputs,
      error: syncResult.error || null,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Execution error occurred',
    });
  }
};

/**
 * ALL /api/webhooks/*
 * Webhook Trigger Execution (Enqueues job to BullMQ queue)
 */
export const handleWebhookTrigger = async (req, res) => {
  try {
    const rawParam = req.params[0] || '';
    const fullPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;

    let activeWorkflows = [];

    try {
      const client = await dbPool.connect();
      const queryRes = await client.query(
        `SELECT id, user_id, name, description, status, workflow_json, version, created_at, updated_at
         FROM workflows
         WHERE status = 'active'`
      );
      client.release();
      activeWorkflows = queryRes.rows;
    } catch (e) {
      // In-memory fallback
    }

    // If PostgreSQL returned 0 rows, fallback to in-memory model lookup
    if (activeWorkflows.length === 0) {
      const fallbackList = await getWorkflowsByUserId('all');
      activeWorkflows = fallbackList.filter((w) => w.status === 'active');
    }

    let matchingWorkflow = null;

    for (const wf of activeWorkflows) {
      const json = typeof wf.workflow_json === 'string' ? JSON.parse(wf.workflow_json) : wf.workflow_json || {};
      const webhookNode = (json.nodes || []).find((n) => {
        const type = n.data?.nodeType || n.type;
        const configPath = n.data?.config?.path || '';
        return (
          type === 'webhook' &&
          (configPath === fullPath ||
            configPath === req.path ||
            configPath === `/${rawParam}` ||
            configPath === rawParam ||
            fullPath.endsWith(configPath))
        );
      });

      if (webhookNode) {
        matchingWorkflow = wf;
        break;
      }
    }

    if (!matchingWorkflow) {
      return res.status(404).json({
        status: 'error',
        message: `No active workflow registered for webhook path "${fullPath}"`,
      });
    }

    const inputData = {
      body: req.body,
      query: req.query,
      headers: req.headers,
      method: req.method,
      path: fullPath,
    };

    const executionRecord = await createExecutionRecord({
      workflowId: matchingWorkflow.id,
      inputData,
      initialStatus: 'queued',
    });

    const enqueueResult = await enqueueWorkflowExecution({
      workflowId: matchingWorkflow.id,
      executionId: executionRecord.id,
      inputData,
    });

    if (enqueueResult.queued) {
      return res.status(200).json({
        status: 'success',
        message: 'Webhook trigger execution queued',
        executionId: executionRecord.id,
        executionStatus: 'queued',
      });
    }

    // Fallback sync execution
    const syncResult = await executeWorkflowGraph({
      workflow: matchingWorkflow,
      initialData: inputData,
      existingExecutionId: executionRecord.id,
    });

    return res.status(200).json({
      status: syncResult.success ? 'success' : 'error',
      message: 'Webhook trigger processed (fallback)',
      executionId: syncResult.executionId,
      executionStatus: syncResult.status,
      outputs: syncResult.outputs,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Webhook trigger execution error',
    });
  }
};

/**
 * GET /api/workflows/:id/executions
 */
export const getWorkflowExecutions = async (req, res) => {
  try {
    const { id } = req.params;

    const executions = await getExecutionsByWorkflowId(id);

    return res.status(200).json({
      status: 'success',
      count: executions.length,
      executions,
    });
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch executions history',
    });
  }
};

/**
 * GET /api/executions/:executionId
 */
export const getExecutionById = async (req, res) => {
  try {
    const { executionId } = req.params;

    const execution = await getExecutionByIdModel(executionId);
    if (!execution) {
      return res.status(404).json({
        status: 'error',
        message: 'Execution record not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      execution,
    });
  } catch (error) {
    console.error('Error fetching execution record:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch execution detail',
    });
  }
};
