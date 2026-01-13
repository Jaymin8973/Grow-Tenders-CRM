import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { Team, User } from '../models';

// Get all teams (filtered by role)
export const getTeams = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let query = {};

        // Manager can only see their own team
        if (req.user?.role === 'manager') {
            query = { managerId: req.user._id };
        }

        const teams = await Team.find(query)
            .populate('managerId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        // Get member count for each team
        const teamsWithMembers = await Promise.all(
            teams.map(async (team) => {
                const memberCount = await User.countDocuments({ teamId: team._id });
                return {
                    ...team.toObject(),
                    memberCount,
                };
            })
        );

        res.json({ teams: teamsWithMembers });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create team (Super Admin only)
export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, managerId, branchId, branchName, description } = req.body;

        if (!name || !managerId || !branchId) {
            res.status(400).json({ message: 'Name, manager, and branch are required' });
            return;
        }

        // Verify manager exists and is a manager
        const manager = await User.findById(managerId);
        if (!manager || manager.role !== 'manager') {
            res.status(400).json({ message: 'Invalid manager' });
            return;
        }

        const team = new Team({
            name,
            managerId,
            branchId,
            branchName,
            description,
        });

        await team.save();

        res.status(201).json({
            message: 'Team created successfully',
            team,
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get team members
export const getTeamMembers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const team = await Team.findById(id);
        if (!team) {
            res.status(404).json({ message: 'Team not found' });
            return;
        }

        // Check access: Manager can only see their own team
        if (req.user?.role === 'manager' && team.managerId.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const members = await User.find({ teamId: id })
            .select('-password')
            .sort({ firstName: 1 });

        res.json({ team, members });
    } catch (error) {
        console.error('Get team members error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add member to team
export const addTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const team = await Team.findById(id);
        if (!team) {
            res.status(404).json({ message: 'Team not found' });
            return;
        }

        // Check access
        if (req.user?.role === 'manager' && team.managerId.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.role !== 'employee') {
            res.status(400).json({ message: 'Only employees can be added to teams' });
            return;
        }

        // One employee per team rule
        if (user.teamId) {
            res.status(400).json({ message: 'Employee is already in a team' });
            return;
        }

        user.teamId = team._id;
        await user.save();

        res.json({ message: 'Member added successfully', user });
    } catch (error) {
        console.error('Add team member error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove member from team
export const removeTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, userId } = req.params;

        const team = await Team.findById(id);
        if (!team) {
            res.status(404).json({ message: 'Team not found' });
            return;
        }

        // Check access
        if (req.user?.role === 'manager' && team.managerId.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        const user = await User.findById(userId);
        if (!user || user.teamId?.toString() !== id) {
            res.status(404).json({ message: 'User not in this team' });
            return;
        }

        user.teamId = undefined;
        await user.save();

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove team member error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
