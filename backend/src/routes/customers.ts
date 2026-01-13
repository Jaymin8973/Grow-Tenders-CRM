import { Router } from 'express';
import { auth, requireManager } from '../middleware';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController';

const router = Router();

router.use(auth);

// Get customers
router.get('/', getCustomers);

// Create customer
router.post('/', createCustomer);

// Update customer
router.put('/:id', updateCustomer);

// Delete customer
router.delete('/:id', requireManager, deleteCustomer);

export default router;
