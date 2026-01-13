import { Router } from 'express';
import { auth } from '../middleware';
import { getFollowUps, createFollowUp, updateFollowUp, completeFollowUp, deleteFollowUp } from '../controllers/followUpController';

const router = Router();

router.use(auth);

// Get follow-ups
router.get('/', getFollowUps);

// Create follow-up
router.post('/', createFollowUp);

// Mark complete
router.post('/:id/complete', completeFollowUp);

// Update follow-up
router.put('/:id', updateFollowUp);

// Delete follow-up
router.delete('/:id', deleteFollowUp);

export default router;
