import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { Lead, Deal, Customer, FollowUp, Activity, Team, User } from '../models';

// Get dashboard stats
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        let branchFilter: Record<string, unknown> = {};
        let assignedFilter: Record<string, unknown> = {};

        // Role-based filtering
        if (user.role === 'employee') {
            assignedFilter = { assignedTo: user._id };
            branchFilter = { branchId: user.branchId };
        } else if (user.role === 'manager') {
            branchFilter = { branchId: user.branchId };
        }
        // super_admin sees all

        // Get lead counts
        const totalLeads = await Lead.countDocuments({
            ...branchFilter,
            ...(user.role === 'employee' ? assignedFilter : {})
        });

        // Get deal counts and revenue
        const dealQuery = user.role === 'employee'
            ? { owner: user._id }
            : branchFilter;

        const activeDeals = await Deal.countDocuments({
            ...dealQuery,
            stage: { $nin: ['closed_won', 'closed_lost'] }
        });

        const closedDeals = await Deal.find({
            ...dealQuery,
            stage: 'closed_won'
        });

        const totalRevenue = closedDeals.reduce((sum, deal) => sum + deal.value, 0);

        // Get pending follow-ups
        const followUpQuery = user.role === 'employee'
            ? { assignedTo: user._id }
            : branchFilter;

        const pendingFollowUps = await FollowUp.countDocuments({
            ...followUpQuery,
            status: { $in: ['pending', 'overdue'] }
        });

        // Calculate changes (mock for now - would need historical data)
        const stats = {
            leads: {
                value: totalLeads,
                change: 12.5,
                label: user.role === 'employee' ? 'My Leads' : 'Total Leads'
            },
            deals: {
                value: activeDeals,
                change: 8.2,
                label: user.role === 'employee' ? 'My Deals' : 'Active Deals'
            },
            revenue: {
                value: totalRevenue,
                change: 23.1,
                label: user.role === 'employee' ? 'My Revenue' : 'Total Revenue'
            },
            followUps: {
                value: pendingFollowUps,
                change: -5.3,
                label: user.role === 'employee' ? 'My Follow-ups' : 'Pending Follow-ups'
            }
        };

        res.json({ stats });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get pipeline data for charts
export const getPipelineStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        let matchQuery: Record<string, unknown> = {};
        if (user.role === 'employee') {
            matchQuery = { owner: user._id };
        } else if (user.role === 'manager') {
            matchQuery = { branchId: user.branchId };
        }

        const pipeline = await Deal.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$stage',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$value' }
                }
            }
        ]);

        const stageColors: Record<string, string> = {
            prospecting: '#6366f1',
            qualification: '#8b5cf6',
            proposal: '#a855f7',
            negotiation: '#d946ef',
            closed_won: '#10b981',
            closed_lost: '#ef4444'
        };

        const stageNames: Record<string, string> = {
            prospecting: 'Prospecting',
            qualification: 'Qualification',
            proposal: 'Proposal',
            negotiation: 'Negotiation',
            closed_won: 'Closed Won',
            closed_lost: 'Closed Lost'
        };

        const pipelineData = pipeline.map(item => ({
            name: stageNames[item._id] || item._id,
            value: item.count,
            totalValue: item.totalValue,
            color: stageColors[item._id] || '#9ca3af'
        }));

        res.json({ pipeline: pipelineData });
    } catch (error) {
        console.error('Pipeline stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get leaderboard
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        let matchQuery: Record<string, unknown> = { stage: 'closed_won' };
        if (user.role === 'manager') {
            matchQuery.branchId = user.branchId;
        }
        // super_admin sees all

        const leaderboard = await Deal.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$owner',
                    totalRevenue: { $sum: '$value' },
                    dealCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' }
        ]);

        const formattedLeaderboard = leaderboard.map((entry, index) => ({
            rank: index + 1,
            id: entry._id.toString(),
            name: `${entry.user.firstName} ${entry.user.lastName}`,
            team: entry.user.branchName || 'N/A',
            revenue: entry.totalRevenue,
            deals: entry.dealCount
        }));

        res.json({ leaderboard: formattedLeaderboard });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get recent activity
export const getRecentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        let query: Record<string, unknown> = {};
        if (user.role === 'employee') {
            query = { userId: user._id };
        } else if (user.role === 'manager') {
            query = { branchId: user.branchId };
        }

        const activities = await Activity.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'firstName lastName');

        const formattedActivities = activities.map(activity => ({
            id: activity._id,
            type: activity.type,
            message: activity.message,
            time: activity.createdAt,
            entityType: activity.entityType
        }));

        res.json({ activities: formattedActivities });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get today's tasks (follow-ups)
export const getTodaysTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let query: Record<string, unknown> = {
            dueDate: { $gte: today, $lt: tomorrow }
        };

        if (user.role === 'employee') {
            query.assignedTo = user._id;
        } else if (user.role === 'manager') {
            query.branchId = user.branchId;
        }

        const tasks = await FollowUp.find(query)
            .sort({ dueTime: 1 })
            .limit(10);

        const formattedTasks = tasks.map(task => ({
            id: task._id,
            title: task.title,
            time: task.dueTime,
            type: task.type,
            completed: task.status === 'completed',
            priority: task.priority
        }));

        res.json({ tasks: formattedTasks });
    } catch (error) {
        console.error('Today\'s tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get revenue chart data (monthly)
export const getRevenueData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        let matchQuery: Record<string, unknown> = { stage: 'closed_won' };
        if (user.role === 'employee') {
            matchQuery.owner = user._id;
        } else if (user.role === 'manager') {
            matchQuery.branchId = user.branchId;
        }

        // Get last 12 months data
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const revenueByMonth = await Deal.aggregate([
            {
                $match: {
                    ...matchQuery,
                    createdAt: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$value' },
                    deals: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const formattedData = revenueByMonth.map(item => ({
            month: months[item._id.month - 1],
            revenue: item.revenue,
            deals: item.deals
        }));

        res.json({ revenueData: formattedData });
    } catch (error) {
        console.error('Revenue data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
