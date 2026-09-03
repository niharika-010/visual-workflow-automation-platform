import { Router } from 'express';
import {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  getWorkflowVersions,
  restoreWorkflowVersion,
} from '../controllers/workflow.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateWorkflowSchema } from '../middleware/validateWorkflow.middleware.js';

const router = Router();

// Protect all workflow routes with JWT authentication
router.use(authenticateToken);

router.post('/', validateWorkflowSchema, createWorkflow);
router.get('/', getWorkflows);
router.get('/:id', getWorkflowById);
router.put('/:id', validateWorkflowSchema, updateWorkflow);
router.delete('/:id', deleteWorkflow);

router.post('/:id/activate', activateWorkflow);
router.post('/:id/deactivate', deactivateWorkflow);

// Versioning routes (Phase 6)
router.get('/:id/versions', getWorkflowVersions);
router.post('/:id/versions/:versionId/restore', restoreWorkflowVersion);

export default router;
