import { Router } from 'express';
import {
  executeWorkflow,
  getWorkflowExecutions,
  getExecutionById,
  handleWebhookTrigger,
} from '../controllers/execution.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public Webhook trigger endpoint
router.all('/webhooks/*', handleWebhookTrigger);

// Protected execution endpoints
router.post('/workflows/:id/execute', authenticateToken, executeWorkflow);
router.get('/workflows/:id/executions', authenticateToken, getWorkflowExecutions);
router.get('/executions/:executionId', authenticateToken, getExecutionById);

export default router;
