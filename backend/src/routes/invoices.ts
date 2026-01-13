import { Router } from 'express';
import { auth, requireManager } from '../middleware';
import {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoiceStatus,
    getInvoicePdfData,
    sendInvoiceEmail,
} from '../controllers/invoiceController';

const router = Router();

// All routes require authentication
router.use(auth);

// Get all invoices
router.get('/', getInvoices);

// Get single invoice
router.get('/:id', getInvoice);

// Get invoice PDF data
router.get('/:id/pdf', getInvoicePdfData);

// Create invoice (manager+)
router.post('/', requireManager, createInvoice);

// Update invoice status (manager+)
router.patch('/:id/status', requireManager, updateInvoiceStatus);

// Send invoice email (manager+)
router.post('/:id/send', requireManager, sendInvoiceEmail);

export default router;
