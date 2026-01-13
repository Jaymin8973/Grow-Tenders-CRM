import { Router } from 'express';
import {
    getTeams,
    createTeam,
    getTeamMembers,
    addTeamMember,
    removeTeamMember
} from '../controllers';
import { auth, requireManager, requireSuperAdmin } from '../middleware';

const router = Router();

// All routes are protected
router.use(auth);

// Get teams (Manager sees own team, Super Admin sees all)
router.get('/', requireManager, getTeams);

// Create team (Super Admin only)
router.post('/', requireSuperAdmin, createTeam);

// Get team members
router.get('/:id/members', requireManager, getTeamMembers);

// Add member to team
router.post('/:id/members', requireManager, addTeamMember);

// Remove member from team
router.delete('/:id/members/:userId', requireManager, removeTeamMember);

export default router;
