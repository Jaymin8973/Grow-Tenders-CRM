import { Router } from 'express';
import {
    getLeads,
    createLead,
    updateLead,
    getLeadById,
    deleteLead,
    assignLead,
    bulkAssignLeads
} from '../controllers';
import { auth, requireManager, requireEmployee } from '../middleware';

const router = Router();

// All routes are protected
router.use(auth);

// Get leads (filtered by role)
router.get('/', requireEmployee, getLeads);

// Get single lead
router.get('/:id', requireEmployee, getLeadById);

// Create lead (Manager+ only)
router.post('/', requireManager, createLead);

// Update lead
router.put('/:id', requireEmployee, updateLead);

// Delete lead (Manager+ only)
router.delete('/:id', requireManager, deleteLead);

// Assign lead to employee (Manager only)
router.post('/:id/assign', requireManager, assignLead);

// Bulk assign leads (Manager only)
router.post('/bulk-assign', requireManager, bulkAssignLeads);

export default router;
