import { Router } from 'express';
import {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getAvailableEmployees
} from '../controllers';
import { auth, requireManager, requireSuperAdmin } from '../middleware';

const router = Router();

// All routes are protected
router.use(auth);

// Get users (filtered by role)
router.get('/', requireManager, getUsers);

// Get available employees (not in any team)
router.get('/available-employees', requireManager, getAvailableEmployees);

// Get single user
router.get('/:id', requireManager, getUserById);

// Update user (Super Admin only)
router.put('/:id', requireSuperAdmin, updateUser);

// Delete user (Super Admin only)
router.delete('/:id', requireSuperAdmin, deleteUser);

export default router;
