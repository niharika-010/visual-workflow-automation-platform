import { Router } from 'express';
import {
  createCredential,
  getCredentials,
  deleteCredential,
} from '../controllers/credential.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createCredential);
router.get('/', getCredentials);
router.delete('/:id', deleteCredential);

export default router;
