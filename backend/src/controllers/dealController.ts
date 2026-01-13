import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { Deal, Team } from '../models';

// Get deals (filtered by role/branch)
export const getDeals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { stage, page = 1, limit = 20 } = req.query;
        const user = req.user;

        let query: Record<string, unknown> = {};

        if (user?.role === 'employee') {
            query.owner = user._id;
        } else if (user?.role === 'manager') {
            query.branchId = user.branchId;
        }

        if (stage && stage !== 'all') {
            query.stage = stage;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const deals = await Deal.find(query)
            .populate('owner', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Deal.countDocuments(query);

        res.json({
            deals,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get deals error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get deals grouped by stage (for pipeline view)
export const getDealsByStage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;

        let query: Record<string, unknown> = {};
        if (user?.role === 'employee') {
            query.owner = user._id;
        } else if (user?.role === 'manager') {
            query.branchId = user.branchId;
        }

        const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

        const stageData = await Promise.all(
            stages.map(async (stage) => {
                const deals = await Deal.find({ ...query, stage })
                    .populate('owner', 'firstName lastName')
                    .sort({ createdAt: -1 });
                return {
                    id: stage,
                    name: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    color: getStageColor(stage),
                    deals: deals.map(d => ({
                        id: d._id,
                        title: d.title,
                        company: d.company,
                        value: d.value,
                        owner: d.owner ? `${(d.owner as any).firstName} ${(d.owner as any).lastName}` : 'Unassigned',
                        expectedClose: d.expectedCloseDate,
                        probability: d.probability,
                        stageId: d.stage
                    }))
                };
            })
        );

        res.json({ stages: stageData });
    } catch (error) {
        console.error('Get deals by stage error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

function getStageColor(stage: string): string {
    const colors: Record<string, string> = {
        prospecting: '#6366f1',
        qualification: '#8b5cf6',
        proposal: '#a855f7',
        negotiation: '#d946ef',
        closed_won: '#10b981',
        closed_lost: '#ef4444'
    };
    return colors[stage] || '#9ca3af';
}

// Create deal
export const createDeal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, company, value, probability, stage, expectedCloseDate, notes } = req.body;
        const user = req.user;

        if (!title || !company || !expectedCloseDate) {
            res.status(400).json({ message: 'Title, company, and expected close date are required' });
            return;
        }

        const deal = new Deal({
            title,
            company,
            value: value || 0,
            probability: probability || 20,
            stage: stage || 'prospecting',
            expectedCloseDate: new Date(expectedCloseDate),
            owner: user?._id,
            branchId: user?.branchId || 'branch-del',
            notes,
            createdBy: user?._id
        });

        await deal.save();
        res.status(201).json({ message: 'Deal created successfully', deal });
    } catch (error) {
        console.error('Create deal error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update deal (including stage change)
export const updateDeal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const deal = await Deal.findById(id);
        if (!deal) {
            res.status(404).json({ message: 'Deal not found' });
            return;
        }

        // Check access
        if (req.user?.role === 'employee' && deal.owner.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        Object.assign(deal, updates);
        await deal.save();

        res.json({ message: 'Deal updated successfully', deal });
    } catch (error) {
        console.error('Update deal error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete deal
export const deleteDeal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const deal = await Deal.findByIdAndDelete(id);
        if (!deal) {
            res.status(404).json({ message: 'Deal not found' });
            return;
        }

        res.json({ message: 'Deal deleted successfully' });
    } catch (error) {
        console.error('Delete deal error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
