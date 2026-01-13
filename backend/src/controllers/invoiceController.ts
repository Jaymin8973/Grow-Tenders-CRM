import { Request, Response } from 'express';
import { Invoice, Customer } from '../models';
import mongoose from 'mongoose';
import { sendInvoiceEmail as sendInvoiceEmailService, isEmailConfigured } from '../services/emailService';

// GST Configuration
const GST_RATE = 18;

// Subscription plan prices
const PLAN_PRICES: Record<string, { name: string; price: number }> = {
    basic: { name: 'Basic Plan', price: 999 },
    standard: { name: 'Standard Plan', price: 2499 },
    premium: { name: 'Premium Plan', price: 4999 },
    enterprise: { name: 'Enterprise Plan', price: 9999 },
};

// Get all invoices with filters
export const getInvoices = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { status, page = 1, limit = 10 } = req.query;

        const query: any = {};

        // Branch filtering for non-super_admin
        if (user.role !== 'super_admin') {
            query.branchId = user.branchId;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [invoices, total] = await Promise.all([
            Invoice.find(query)
                .populate('customerId', 'name email')
                .populate('createdBy', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Invoice.countDocuments(query),
        ]);

        // Calculate stats
        const allInvoices = await Invoice.find(query.branchId ? { branchId: query.branchId } : {});
        const stats = {
            total: allInvoices.length,
            paid: allInvoices.filter(i => i.status === 'paid').length,
            pending: allInvoices.filter(i => ['draft', 'sent'].includes(i.status)).length,
            overdue: allInvoices.filter(i => i.status === 'overdue').length,
            totalRevenue: allInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
        };

        res.json({
            invoices,
            stats,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ message: 'Failed to fetch invoices' });
    }
};

// Get single invoice
export const getInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findById(id)
            .populate('customerId', 'name email phone address gstin')
            .populate('createdBy', 'firstName lastName');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ message: 'Failed to fetch invoice' });
    }
};

// Create invoice for a customer
export const createInvoice = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { customerId, planId, duration = 1, notes } = req.body;

        // Get customer
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Get plan details
        const plan = PLAN_PRICES[planId];
        if (!plan) {
            return res.status(400).json({ message: 'Invalid plan' });
        }

        // Calculate amounts
        const subtotal = plan.price * duration;
        const gstAmount = (subtotal * GST_RATE) / 100;
        const total = subtotal + gstAmount;

        // Calculate period
        const periodStart = new Date();
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + duration);

        // Due date (15 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        const invoice = new Invoice({
            customerId,
            planId,
            planName: plan.name,
            subtotal,
            gstRate: GST_RATE,
            gstAmount,
            total,
            invoiceDate: new Date(),
            dueDate,
            periodStart,
            periodEnd,
            status: 'draft',
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            customerAddress: customer.address,
            customerGSTIN: customer.gstin,
            notes,
            branchId: user.branchId,
            createdBy: user._id,
        });

        await invoice.save();

        // Update customer subscription
        await Customer.findByIdAndUpdate(customerId, {
            subscriptionPlan: planId,
            subscriptionStart: periodStart,
            subscriptionEnd: periodEnd,
            subscriptionStatus: 'active',
            lifecycle: 'customer',
        });

        res.status(201).json(invoice);
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ message: 'Failed to create invoice' });
    }
};

// Update invoice status
export const updateInvoiceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updateData: any = { status };
        if (status === 'paid') {
            updateData.paidAt = new Date();
        }

        const invoice = await Invoice.findByIdAndUpdate(id, updateData, { new: true });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Update invoice status error:', error);
        res.status(500).json({ message: 'Failed to update invoice status' });
    }
};

// Get invoice PDF data (for frontend PDF generation)
export const getInvoicePdfData = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findById(id)
            .populate('customerId', 'name email phone address gstin categories states')
            .populate('createdBy', 'firstName lastName');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Company details for invoice
        const companyDetails = {
            name: 'Grow Tenders',
            address: 'Your Company Address',
            email: 'contact@growtenders.com',
            phone: '+91 XXXXX XXXXX',
            gstin: 'XXXXXXXXXXXXXXX',
            website: 'www.growtenders.com',
        };

        res.json({
            invoice,
            company: companyDetails,
        });
    } catch (error) {
        console.error('Get invoice PDF data error:', error);
        res.status(500).json({ message: 'Failed to get invoice PDF data' });
    }
};

// Send invoice email
export const sendInvoiceEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findById(id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if email is configured
        if (isEmailConfigured()) {
            try {
                await sendInvoiceEmailService({
                    invoiceNumber: invoice.invoiceNumber,
                    customerName: invoice.customerName,
                    customerEmail: invoice.customerEmail,
                    planName: invoice.planName,
                    subtotal: invoice.subtotal,
                    gstAmount: invoice.gstAmount,
                    total: invoice.total,
                    invoiceDate: invoice.invoiceDate,
                    dueDate: invoice.dueDate,
                    periodStart: invoice.periodStart,
                    periodEnd: invoice.periodEnd,
                });
            } catch (emailErr) {
                console.error('Email sending failed:', emailErr);
                // Continue anyway - update status even if email fails
            }
        } else {
            console.log('Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
        }

        // Update status to sent
        invoice.status = 'sent';
        await invoice.save();

        res.json({ message: 'Invoice sent successfully', invoice });
    } catch (error) {
        console.error('Send invoice email error:', error);
        res.status(500).json({ message: 'Failed to send invoice' });
    }
};
