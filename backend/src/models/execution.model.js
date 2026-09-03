import { dbPool } from '../config/db.js';
import crypto from 'crypto';

const inMemoryExecutions = new Map();
const inMemorySteps = new Map();

export const createExecutionRecord = async ({ workflowId, inputData = {}, initialStatus = 'queued' }) => {
  try {
    const client = await dbPool.connect();
    const result = await client.query(
      `INSERT INTO executions (workflow_id, status, input_data)
       VALUES ($1, $2, $3)
       RETURNING id, workflow_id, status, started_at, finished_at, input_data, output_data, error`,
      [workflowId, initialStatus, JSON.stringify(inputData)]
    );
    client.release();
    return result.rows[0];
  } catch (err) {
    const newExec = {
      id: crypto.randomUUID(),
      workflow_id: workflowId,
      status: initialStatus,
      started_at: new Date().toISOString(),
      finished_at: null,
      input_data: inputData,
      output_data: {},
      error: null,
    };
    inMemoryExecutions.set(newExec.id, newExec);
    inMemorySteps.set(newExec.id, []);
    return newExec;
  }
};

export const updateExecutionRecord = async (id, { status, outputData = {}, error = null }) => {
  const finishedAt = ['completed', 'failed'].includes(status) ? new Date().toISOString() : null;
  try {
    const client = await dbPool.connect();
    const result = await client.query(
      `UPDATE executions
       SET status = $2,
           output_data = $3,
           error = $4,
           finished_at = CASE WHEN $2 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE finished_at END
       WHERE id = $1
       RETURNING id, workflow_id, status, started_at, finished_at, input_data, output_data, error`,
      [id, status, JSON.stringify(outputData), error]
    );
    client.release();
    return result.rows[0];
  } catch (err) {
    const exec = inMemoryExecutions.get(id);
    if (exec) {
      exec.status = status;
      exec.output_data = outputData;
      exec.error = error;
      if (finishedAt) exec.finished_at = finishedAt;
      inMemoryExecutions.set(id, exec);
      return exec;
    }
    return null;
  }
};

export const createExecutionStepRecord = async ({ executionId, nodeId, inputData = {} }) => {
  try {
    const client = await dbPool.connect();
    const result = await client.query(
      `INSERT INTO execution_steps (execution_id, node_id, status, input_data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, execution_id, node_id, status, input_data, output_data, error, started_at, finished_at`,
      [executionId, nodeId, 'running', JSON.stringify(inputData)]
    );
    client.release();
    return result.rows[0];
  } catch (err) {
    const newStep = {
      id: crypto.randomUUID(),
      execution_id: executionId,
      node_id: nodeId,
      status: 'running',
      input_data: inputData,
      output_data: {},
      error: null,
      started_at: new Date().toISOString(),
      finished_at: null,
    };
    const steps = inMemorySteps.get(executionId) || [];
    steps.push(newStep);
    inMemorySteps.set(executionId, steps);
    return newStep;
  }
};

export const updateExecutionStepRecord = async (stepId, { executionId, status, outputData = {}, error = null }) => {
  const finishedAt = new Date().toISOString();
  try {
    const client = await dbPool.connect();
    const result = await client.query(
      `UPDATE execution_steps
       SET status = $2,
           output_data = $3,
           error = $4,
           finished_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, execution_id, node_id, status, input_data, output_data, error, started_at, finished_at`,
      [stepId, status, JSON.stringify(outputData), error]
    );
    client.release();
    return result.rows[0];
  } catch (err) {
    const steps = inMemorySteps.get(executionId) || [];
    const step = steps.find((s) => s.id === stepId);
    if (step) {
      step.status = status;
      step.output_data = outputData;
      step.error = error;
      step.finished_at = finishedAt;
      return step;
    }
    return null;
  }
};

export const getExecutionsByWorkflowId = async (workflowId) => {
  try {
    const result = await dbPool.query(
      `SELECT id, workflow_id, status, started_at, finished_at, input_data, output_data, error
       FROM executions
       WHERE workflow_id = $1
       ORDER BY started_at DESC`,
      [workflowId]
    );
    return result.rows;
  } catch (err) {
    const list = [];
    for (const exec of inMemoryExecutions.values()) {
      if (exec.workflow_id === workflowId) {
        list.push(exec);
      }
    }
    return list.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  }
};

export const getExecutionById = async (executionId) => {
  try {
    const client = await dbPool.connect();

    const execRes = await client.query(
      `SELECT id, workflow_id, status, started_at, finished_at, input_data, output_data, error
       FROM executions
       WHERE id = $1`,
      [executionId]
    );

    if (execRes.rows.length === 0) {
      client.release();
      return null;
    }

    const stepsRes = await client.query(
      `SELECT id, execution_id, node_id, status, input_data, output_data, error, started_at, finished_at
       FROM execution_steps
       WHERE execution_id = $1
       ORDER BY started_at ASC`,
      [executionId]
    );

    client.release();
    return {
      ...execRes.rows[0],
      steps: stepsRes.rows,
    };
  } catch (err) {
    const exec = inMemoryExecutions.get(executionId);
    if (exec) {
      const steps = inMemorySteps.get(executionId) || [];
      return {
        ...exec,
        steps,
      };
    }
    return null;
  }
};
