import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { User, Team } from '../models';

// Get all users (filtered by role)
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, branchId, status, teamId } = req.query;

        let query: Record<string, unknown> = {};

        // Manager can only see users in their branch
        if (req.user?.role === 'manager') {
            query.branchId = req.user.branchId;
        }

        if (role) query.role = role;
        if (branchId) query.branchId = branchId;
        if (status) query.status = status;
        if (teamId) query.teamId = teamId;

        const users = await User.find(query)
            .select('-password')
            .populate('teamId', 'name')
            .sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user by ID
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select('-password')
            .populate('teamId', 'name');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Don't allow password update through this endpoint
        delete updates.password;

        const user = await User.findByIdAndUpdate(id, updates, { new: true })
            .select('-password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get available employees (not in any team)
export const getAvailableEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let query: Record<string, unknown> = {
            role: 'employee',
            teamId: { $exists: false },
        };

        // Manager can only see employees in their branch
        if (req.user?.role === 'manager') {
            query.branchId = req.user.branchId;
        }

        const employees = await User.find(query)
            .select('-password')
            .sort({ firstName: 1 });

        res.json({ employees });
    } catch (error) {
        console.error('Get available employees error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
