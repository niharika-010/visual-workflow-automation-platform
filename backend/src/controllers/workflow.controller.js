import {
  createWorkflow as createWorkflowModel,
  getWorkflowsByUserId,
  getWorkflowByIdAndUserId,
  updateWorkflow as updateWorkflowModel,
  updateWorkflowStatus,
  deleteWorkflow as deleteWorkflowModel,
  getWorkflowVersions as getWorkflowVersionsModel,
  restoreWorkflowVersion as restoreWorkflowVersionModel,
} from '../models/workflow.model.js';

/**
 * POST /api/workflows
 */
export const createWorkflow = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Workflow name is required',
      });
    }

    const newWorkflow = await createWorkflowModel({
      userId,
      name,
      description: description || '',
    });

    return res.status(201).json({
      status: 'success',
      message: 'Workflow created successfully',
      workflow: newWorkflow,
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create workflow',
    });
  }
};

/**
 * GET /api/workflows
 */
export const getWorkflows = async (req, res) => {
  try {
    const userId = req.user.id;
    const workflows = await getWorkflowsByUserId(userId);

    return res.status(200).json({
      status: 'success',
      count: workflows.length,
      workflows,
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch workflows',
    });
  }
};

/**
 * GET /api/workflows/:id
 */
export const getWorkflowById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const workflow = await getWorkflowByIdAndUserId(id, userId);
    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      workflow,
    });
  } catch (error) {
    console.error('Error fetching workflow by id:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch workflow',
    });
  }
};

/**
 * PUT /api/workflows/:id
 */
export const updateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, status } = req.body;
    
    // req.validatedWorkflowJson is attached by validateWorkflowSchema middleware
    const workflow_json = req.validatedWorkflowJson || req.body.workflow_json;

    if (status && !['draft', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: "Status must be 'draft', 'active', or 'inactive'",
      });
    }

    const updated = await updateWorkflowModel({
      id,
      userId,
      name,
      description,
      status,
      workflow_json,
    });

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Workflow updated successfully',
      workflow: updated,
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update workflow',
    });
  }
};

/**
 * DELETE /api/workflows/:id
 */
export const deleteWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await deleteWorkflowModel(id, userId);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Workflow deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete workflow',
    });
  }
};

/**
 * POST /api/workflows/:id/activate
 */
export const activateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updated = await updateWorkflowStatus(id, userId, 'active');
    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Workflow activated',
      workflow: updated,
    });
  } catch (error) {
    console.error('Error activating workflow:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to activate workflow',
    });
  }
};

/**
 * POST /api/workflows/:id/deactivate
 */
export const deactivateWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updated = await updateWorkflowStatus(id, userId, 'inactive');
    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Workflow deactivated',
      workflow: updated,
    });
  } catch (error) {
    console.error('Error deactivating workflow:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to deactivate workflow',
    });
  }
};

/**
 * GET /api/workflows/:id/versions
 */
export const getWorkflowVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const versions = await getWorkflowVersionsModel(id, userId);
    if (!versions) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      count: versions.length,
      versions,
    });
  } catch (error) {
    console.error('Error fetching workflow versions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch workflow versions',
    });
  }
};

/**
 * POST /api/workflows/:id/versions/:versionId/restore
 */
export const restoreWorkflowVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.id;

    const restored = await restoreWorkflowVersionModel(id, versionId, userId);
    if (!restored) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow or version snapshot not found or access denied',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Workflow restored to version successfully`,
      workflow: restored,
    });
  } catch (error) {
    console.error('Error restoring workflow version:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to restore workflow version',
    });
  }
};
