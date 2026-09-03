import { dbPool } from '../config/db.js';
import crypto from 'crypto';

// In-memory fallback repository when PostgreSQL container is offline
export const inMemoryWorkflows = new Map();
const inMemoryVersions = new Map();

export const createWorkflow = async ({ userId, name, description = '' }) => {
  const defaultWorkflowJson = { nodes: [], edges: [] };
  const status = 'draft';
  const version = 1;

  try {
    const client = await dbPool.connect();
    const result = await client.query(
      `INSERT INTO workflows (user_id, name, description, status, workflow_json, version)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, description, status, workflow_json, version, created_at, updated_at`,
      [userId, name.trim(), description.trim(), status, JSON.stringify(defaultWorkflowJson), version]
    );

    const newWf = result.rows[0];

    // Create initial version snapshot in workflow_versions
    await client.query(
      `INSERT INTO workflow_versions (workflow_id, version, workflow_json)
       VALUES ($1, $2, $3)`,
      [newWf.id, 1, JSON.stringify(defaultWorkflowJson)]
    );

    client.release();
    return newWf;
  } catch (err) {
    // Fallback to in-memory store
    const newWorkflow = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: name.trim(),
      description: description.trim(),
      status,
      workflow_json: defaultWorkflowJson,
      version,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryWorkflows.set(newWorkflow.id, newWorkflow);
    inMemoryVersions.set(newWorkflow.id, [
      {
        id: crypto.randomUUID(),
        workflow_id: newWorkflow.id,
        version: 1,
        workflow_json: defaultWorkflowJson,
        created_at: newWorkflow.created_at,
      },
    ]);
    return newWorkflow;
  }
};

export const getWorkflowsByUserId = async (userId) => {
  try {
    const query = userId && userId !== 'all'
      ? `SELECT id, user_id, name, description, status, workflow_json, version, created_at, updated_at FROM workflows WHERE user_id = $1 ORDER BY updated_at DESC`
      : `SELECT id, user_id, name, description, status, workflow_json, version, created_at, updated_at FROM workflows ORDER BY updated_at DESC`;
    const params = userId && userId !== 'all' ? [userId] : [];

    const result = await dbPool.query(query, params);
    return result.rows;
  } catch (err) {
    const userWorkflows = [];
    for (const workflow of inMemoryWorkflows.values()) {
      if (!userId || userId === 'all' || workflow.user_id === userId) {
        userWorkflows.push(workflow);
      }
    }
    return userWorkflows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
};

export const getWorkflowByIdAndUserId = async (id, userId) => {
  try {
    const result = await dbPool.query(
      `SELECT id, user_id, name, description, status, workflow_json, version, created_at, updated_at
       FROM workflows
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (err) {
    const workflow = inMemoryWorkflows.get(id);
    if (workflow && (workflow.user_id === userId || !userId)) {
      return workflow;
    }
    return null;
  }
};

export const updateWorkflow = async ({ id, userId, name, description, status, workflow_json }) => {
  try {
    const client = await dbPool.connect();

    const checkRes = await client.query(
      `SELECT id, version FROM workflows WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (checkRes.rows.length === 0) {
      client.release();
      return null;
    }

    const currentVersion = checkRes.rows[0].version;
    const newVersion = currentVersion + 1;
    const jsonString = workflow_json ? JSON.stringify(workflow_json) : null;

    const result = await client.query(
      `UPDATE workflows
       SET name = COALESCE($3, name),
           description = COALESCE($4, description),
           status = COALESCE($5, status),
           workflow_json = COALESCE($6, workflow_json),
           version = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, name, description, status, workflow_json, version, created_at, updated_at`,
      [id, userId, name ? name.trim() : null, description !== undefined ? description.trim() : null, status || null, jsonString, newVersion]
    );

    const updatedWf = result.rows[0];

    if (workflow_json) {
      await client.query(
        `INSERT INTO workflow_versions (workflow_id, version, workflow_json)
         VALUES ($1, $2, $3)`,
        [id, newVersion, jsonString]
      );
    }

    client.release();
    return updatedWf;
  } catch (err) {
    const workflow = inMemoryWorkflows.get(id);
    if (workflow && (workflow.user_id === userId || !userId)) {
      if (name !== undefined) workflow.name = name.trim();
      if (description !== undefined) workflow.description = description.trim();
      if (status !== undefined) workflow.status = status;
      if (workflow_json !== undefined) workflow.workflow_json = workflow_json;
      workflow.version += 1;
      workflow.updated_at = new Date().toISOString();
      inMemoryWorkflows.set(id, workflow);

      const versionList = inMemoryVersions.get(id) || [];
      versionList.unshift({
        id: crypto.randomUUID(),
        workflow_id: id,
        version: workflow.version,
        workflow_json: workflow.workflow_json,
        created_at: workflow.updated_at,
      });
      inMemoryVersions.set(id, versionList);

      return workflow;
    }
    return null;
  }
};

export const updateWorkflowStatus = async (id, userId, newStatus) => {
  try {
    const result = await dbPool.query(
      `UPDATE workflows
       SET status = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, name, description, status, workflow_json, version, created_at, updated_at`,
      [id, userId, newStatus]
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (err) {
    const workflow = inMemoryWorkflows.get(id);
    if (workflow && (workflow.user_id === userId || !userId)) {
      workflow.status = newStatus;
      workflow.updated_at = new Date().toISOString();
      inMemoryWorkflows.set(id, workflow);
      return workflow;
    }
    return null;
  }
};

export const deleteWorkflow = async (id, userId) => {
  try {
    const result = await dbPool.query(
      `DELETE FROM workflows WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return result.rowCount > 0;
  } catch (err) {
    const workflow = inMemoryWorkflows.get(id);
    if (workflow && (workflow.user_id === userId || !userId)) {
      inMemoryWorkflows.delete(id);
      inMemoryVersions.delete(id);
      return true;
    }
    return false;
  }
};

export const getWorkflowVersions = async (workflowId, userId) => {
  try {
    const client = await dbPool.connect();

    const checkRes = await client.query(
      `SELECT id FROM workflows WHERE id = $1 AND user_id = $2`,
      [workflowId, userId]
    );
    if (checkRes.rows.length === 0) {
      client.release();
      return null;
    }

    const versionsRes = await client.query(
      `SELECT id, workflow_id, version, workflow_json, created_at
       FROM workflow_versions
       WHERE workflow_id = $1
       ORDER BY version DESC`,
      [workflowId]
    );

    client.release();
    return versionsRes.rows;
  } catch (err) {
    const workflow = inMemoryWorkflows.get(workflowId);
    if (workflow && (workflow.user_id === userId || !userId)) {
      return inMemoryVersions.get(workflowId) || [];
    }
    return null;
  }
};

export const restoreWorkflowVersion = async (workflowId, versionId, userId) => {
  try {
    const client = await dbPool.connect();

    const checkRes = await client.query(
      `SELECT id, version FROM workflows WHERE id = $1 AND user_id = $2`,
      [workflowId, userId]
    );
    if (checkRes.rows.length === 0) {
      client.release();
      return null;
    }

    const targetVersionRes = await client.query(
      `SELECT version, workflow_json FROM workflow_versions WHERE id = $1 AND workflow_id = $2`,
      [versionId, workflowId]
    );

    if (targetVersionRes.rows.length === 0) {
      client.release();
      return null;
    }

    const targetJson = targetVersionRes.rows[0].workflow_json;
    const newVersionNumber = checkRes.rows[0].version + 1;

    const updateRes = await client.query(
      `UPDATE workflows
       SET workflow_json = $3,
           version = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, name, description, status, workflow_json, version, created_at, updated_at`,
      [workflowId, userId, JSON.stringify(targetJson), newVersionNumber]
    );

    await client.query(
      `INSERT INTO workflow_versions (workflow_id, version, workflow_json)
       VALUES ($1, $2, $3)`,
      [workflowId, newVersionNumber, JSON.stringify(targetJson)]
    );

    client.release();
    return updateRes.rows[0];
  } catch (err) {
    const workflow = inMemoryWorkflows.get(workflowId);
    if (workflow && (workflow.user_id === userId || !userId)) {
      const versionList = inMemoryVersions.get(workflowId) || [];
      const targetVersion = versionList.find((v) => v.id === versionId);
      if (targetVersion) {
        workflow.workflow_json = targetVersion.workflow_json;
        workflow.version += 1;
        workflow.updated_at = new Date().toISOString();

        versionList.unshift({
          id: crypto.randomUUID(),
          workflow_id: workflowId,
          version: workflow.version,
          workflow_json: targetVersion.workflow_json,
          created_at: workflow.updated_at,
        });

        inMemoryWorkflows.set(workflowId, workflow);
        inMemoryVersions.set(workflowId, versionList);
        return workflow;
      }
    }
    return null;
  }
};
