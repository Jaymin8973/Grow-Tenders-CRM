import { Router } from 'express';
import { auth, requireManager } from '../middleware';
import { getDeals, getDealsByStage, createDeal, updateDeal, deleteDeal } from '../controllers/dealController';

const router = Router();

router.use(auth);

// Get deals list
router.get('/', getDeals);

// Get deals by stage (for pipeline view)
router.get('/pipeline', getDealsByStage);

// Create deal
router.post('/', createDeal);

// Update deal
router.put('/:id', updateDeal);

// Delete deal
router.delete('/:id', requireManager, deleteDeal);

export default router;
