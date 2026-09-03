import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);

// Protected auth endpoints
router.get('/me', authenticateToken, getMe);

export default router;
