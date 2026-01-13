import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { Customer } from '../models';

// Get customers (filtered by role/branch)
export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lifecycle, page = 1, limit = 20 } = req.query;
        const user = req.user;

        let query: Record<string, unknown> = {};

        if (user?.role === 'employee') {
            query.owner = user._id;
        } else if (user?.role === 'manager') {
            query.branchId = user.branchId;
        }

        if (lifecycle && lifecycle !== 'all') {
            query.lifecycle = lifecycle;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const customers = await Customer.find(query)
            .populate('owner', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Customer.countDocuments(query);

        // Get stats
        const statsQuery = user?.role === 'employee'
            ? { owner: user._id }
            : user?.role === 'manager'
                ? { branchId: user?.branchId }
                : {};

        const totalCustomers = await Customer.countDocuments({ ...statsQuery, lifecycle: 'customer' });
        const allCustomers = await Customer.find(statsQuery);
        const totalRevenue = allCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);
        const totalDeals = allCustomers.reduce((sum, c) => sum + c.totalDeals, 0);
        const avgDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0;
        const activeProspects = await Customer.countDocuments({ ...statsQuery, lifecycle: 'prospect' });

        res.json({
            customers,
            stats: {
                totalCustomers,
                totalRevenue,
                avgDealValue,
                activeProspects
            },
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create customer
export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, type, email, phone, website, industry, lifecycle, address, notes } = req.body;
        const user = req.user;

        if (!name || !email || !industry) {
            res.status(400).json({ message: 'Name, email, and industry are required' });
            return;
        }

        const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
        if (existingCustomer) {
            res.status(400).json({ message: 'Customer with this email already exists' });
            return;
        }

        const customer = new Customer({
            name,
            type: type || 'company',
            email: email.toLowerCase(),
            phone,
            website,
            industry,
            lifecycle: lifecycle || 'lead',
            address,
            notes,
            owner: user?._id,
            branchId: user?.branchId || 'branch-del',
            createdBy: user?._id
        });

        await customer.save();
        res.status(201).json({ message: 'Customer created successfully', customer });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update customer
export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const customer = await Customer.findById(id);
        if (!customer) {
            res.status(404).json({ message: 'Customer not found' });
            return;
        }

        if (req.user?.role === 'employee' && customer.owner.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        Object.assign(customer, updates);
        await customer.save();

        res.json({ message: 'Customer updated successfully', customer });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete customer
export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const customer = await Customer.findByIdAndDelete(id);
        if (!customer) {
            res.status(404).json({ message: 'Customer not found' });
            return;
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
