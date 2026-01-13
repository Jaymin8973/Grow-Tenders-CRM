import { Router } from 'express';
import authRoutes from './auth';
import teamRoutes from './teams';
import leadRoutes from './leads';
import userRoutes from './users';
import statsRoutes from './stats';
import dealRoutes from './deals';
import customerRoutes from './customers';
import followUpRoutes from './followups';
import invoiceRoutes from './invoices';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teams', teamRoutes);
router.use('/leads', leadRoutes);
router.use('/users', userRoutes);
router.use('/stats', statsRoutes);
router.use('/deals', dealRoutes);
router.use('/customers', customerRoutes);
router.use('/followups', followUpRoutes);
router.use('/invoices', invoiceRoutes);

export default router;
