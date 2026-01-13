import { Router } from 'express';
import { login, register, getMe } from '../controllers';
import { auth, requireSuperAdmin, requireManager } from '../middleware';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes
router.post('/register', auth, requireManager, register);
router.get('/me', auth, getMe);

export default router;
