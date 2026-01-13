import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { FollowUp } from '../models';

// Get follow-ups (filtered by role/branch)
export const getFollowUps = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const user = req.user;

        let query: Record<string, unknown> = {};

        if (user?.role === 'employee') {
            query.assignedTo = user._id;
        } else if (user?.role === 'manager') {
            query.branchId = user.branchId;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const followUps = await FollowUp.find(query)
            .populate('assignedTo', 'firstName lastName')
            .sort({ dueDate: 1, dueTime: 1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await FollowUp.countDocuments(query);

        // Get stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const statsQuery = user?.role === 'employee'
            ? { assignedTo: user._id }
            : user?.role === 'manager'
                ? { branchId: user?.branchId }
                : {};

        const dueToday = await FollowUp.countDocuments({
            ...statsQuery,
            dueDate: { $gte: today, $lt: tomorrow },
            status: 'pending'
        });

        const overdue = await FollowUp.countDocuments({
            ...statsQuery,
            status: 'overdue'
        });

        const completedThisWeek = await FollowUp.countDocuments({
            ...statsQuery,
            status: 'completed',
            completedAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
        });

        const totalPending = await FollowUp.countDocuments({
            ...statsQuery,
            status: 'pending'
        });

        res.json({
            followUps: followUps.map(f => ({
                id: f._id,
                title: f.title,
                type: f.type,
                contact: {
                    name: f.contactName,
                    company: f.contactCompany,
                    email: f.contactEmail
                },
                dueDate: f.dueDate,
                dueTime: f.dueTime,
                priority: f.priority,
                status: f.status,
                notes: f.notes,
                assignedTo: f.assignedTo ? `${(f.assignedTo as any).firstName} ${(f.assignedTo as any).lastName}` : 'Unassigned'
            })),
            stats: {
                dueToday,
                overdue,
                completedThisWeek,
                totalPending
            },
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get follow-ups error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create follow-up
export const createFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, type, contactName, contactCompany, contactEmail, dueDate, dueTime, priority, notes, leadId, customerId } = req.body;
        const user = req.user;

        if (!title || !type || !contactName || !contactCompany || !dueDate || !dueTime) {
            res.status(400).json({ message: 'Title, type, contact name, company, due date and time are required' });
            return;
        }

        const followUp = new FollowUp({
            title,
            type,
            contactName,
            contactCompany,
            contactEmail,
            dueDate: new Date(dueDate),
            dueTime,
            priority: priority || 'medium',
            status: 'pending',
            notes,
            leadId,
            customerId,
            assignedTo: user?._id,
            branchId: user?.branchId || 'branch-del',
            createdBy: user?._id
        });

        await followUp.save();
        res.status(201).json({ message: 'Follow-up created successfully', followUp });
    } catch (error) {
        console.error('Create follow-up error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark follow-up complete
export const completeFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const followUp = await FollowUp.findById(id);
        if (!followUp) {
            res.status(404).json({ message: 'Follow-up not found' });
            return;
        }

        if (req.user?.role === 'employee' && followUp.assignedTo.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        followUp.status = 'completed';
        followUp.completedAt = new Date();
        await followUp.save();

        res.json({ message: 'Follow-up marked as complete', followUp });
    } catch (error) {
        console.error('Complete follow-up error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update follow-up
export const updateFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const followUp = await FollowUp.findById(id);
        if (!followUp) {
            res.status(404).json({ message: 'Follow-up not found' });
            return;
        }

        if (req.user?.role === 'employee' && followUp.assignedTo.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        Object.assign(followUp, updates);
        await followUp.save();

        res.json({ message: 'Follow-up updated successfully', followUp });
    } catch (error) {
        console.error('Update follow-up error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete follow-up
export const deleteFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const followUp = await FollowUp.findByIdAndDelete(id);
        if (!followUp) {
            res.status(404).json({ message: 'Follow-up not found' });
            return;
        }

        res.json({ message: 'Follow-up deleted successfully' });
    } catch (error) {
        console.error('Delete follow-up error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
