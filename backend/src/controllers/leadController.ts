import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { Lead, User, Team } from '../models';
import mongoose from 'mongoose';

// Get leads (filtered by role)
export const getLeads = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, leadType, assignedTo, teamId, page = 1, limit = 20 } = req.query;

        let query: Record<string, unknown> = {};

        // Role-based filtering
        if (req.user?.role === 'employee') {
            // Employee sees only their assigned leads
            query.assignedTo = req.user._id;
        } else if (req.user?.role === 'manager') {
            // Manager sees leads from their team
            const team = await Team.findOne({ managerId: req.user._id });
            if (team) {
                const teamMembers = await User.find({ teamId: team._id }).select('_id');
                const memberIds = teamMembers.map(m => m._id);
                memberIds.push(req.user._id); // Include manager themselves
                query.$or = [
                    { assignedTo: { $in: memberIds } },
                    { teamId: team._id },
                    { createdBy: req.user._id }
                ];
            }
        }
        // Super admin sees all leads

        // Additional filters
        if (status) query.status = status;
        if (leadType) query.leadType = leadType;
        if (assignedTo) query.assignedTo = assignedTo;
        if (teamId) query.teamId = teamId;

        const skip = (Number(page) - 1) * Number(limit);

        const leads = await Lead.find(query)
            .populate('assignedTo', 'firstName lastName email')
            .populate('assignedBy', 'firstName lastName')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Lead.countDocuments(query);

        res.json({
            leads,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create lead
export const createLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            firstName, lastName, email, phone, company,
            source, leadType, status, score, expectedValue, notes, branchId
        } = req.body;

        if (!firstName || !lastName || !email) {
            res.status(400).json({ message: 'First name, last name, and email are required' });
            return;
        }

        const lead = new Lead({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            company,
            source: source || 'other',
            leadType: leadType || 'cold',
            status: status || 'new',
            score: score || 50,
            expectedValue: expectedValue || 0,
            notes,
            branchId: branchId || req.user?.branchId,
            createdBy: req.user?._id,
        });

        await lead.save();

        res.status(201).json({
            message: 'Lead created successfully',
            lead,
        });
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update lead
export const updateLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const lead = await Lead.findById(id);
        if (!lead) {
            res.status(404).json({ message: 'Lead not found' });
            return;
        }

        // Check access
        if (req.user?.role === 'employee') {
            if (lead.assignedTo?.toString() !== req.user._id.toString()) {
                res.status(403).json({ message: 'Access denied' });
                return;
            }
        }

        // Don't allow changing assignment through update (use assign endpoint)
        delete updates.assignedTo;
        delete updates.assignedBy;
        delete updates.assignedAt;

        Object.assign(lead, updates);
        await lead.save();

        res.json({ message: 'Lead updated successfully', lead });
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Assign lead to employee (Manager only)
export const assignLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { employeeId } = req.body;

        const lead = await Lead.findById(id);
        if (!lead) {
            res.status(404).json({ message: 'Lead not found' });
            return;
        }

        const employee = await User.findById(employeeId);
        if (!employee || employee.role !== 'employee') {
            res.status(400).json({ message: 'Invalid employee' });
            return;
        }

        // Manager can only assign to their team members
        if (req.user?.role === 'manager') {
            const team = await Team.findOne({ managerId: req.user._id });
            if (!team || employee.teamId?.toString() !== team._id.toString()) {
                res.status(403).json({ message: 'Can only assign to your team members' });
                return;
            }
            lead.teamId = team._id;
        }

        lead.assignedTo = employee._id as mongoose.Types.ObjectId;
        lead.assignedBy = req.user?._id as mongoose.Types.ObjectId;
        lead.assignedAt = new Date();

        await lead.save();

        const populatedLead = await Lead.findById(id)
            .populate('assignedTo', 'firstName lastName email');

        res.json({ message: 'Lead assigned successfully', lead: populatedLead });
    } catch (error) {
        console.error('Assign lead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Bulk assign leads
export const bulkAssignLeads = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { leadIds, employeeId } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            res.status(400).json({ message: 'Lead IDs are required' });
            return;
        }

        const employee = await User.findById(employeeId);
        if (!employee || employee.role !== 'employee') {
            res.status(400).json({ message: 'Invalid employee' });
            return;
        }

        let teamId;
        if (req.user?.role === 'manager') {
            const team = await Team.findOne({ managerId: req.user._id });
            if (!team || employee.teamId?.toString() !== team._id.toString()) {
                res.status(403).json({ message: 'Can only assign to your team members' });
                return;
            }
            teamId = team._id;
        }

        const result = await Lead.updateMany(
            { _id: { $in: leadIds } },
            {
                $set: {
                    assignedTo: employee._id,
                    assignedBy: req.user?._id,
                    assignedAt: new Date(),
                    ...(teamId && { teamId }),
                },
            }
        );

        res.json({
            message: `${result.modifiedCount} leads assigned successfully`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('Bulk assign error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get lead by ID
export const getLeadById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lead = await Lead.findById(id)
            .populate('assignedTo', 'firstName lastName email')
            .populate('assignedBy', 'firstName lastName')
            .populate('createdBy', 'firstName lastName');

        if (!lead) {
            res.status(404).json({ message: 'Lead not found' });
            return;
        }

        // Check access for employee
        if (req.user?.role === 'employee') {
            if (lead.assignedTo?.toString() !== req.user._id.toString()) {
                res.status(403).json({ message: 'Access denied' });
                return;
            }
        }

        res.json({ lead });
    } catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete lead
export const deleteLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lead = await Lead.findByIdAndDelete(id);
        if (!lead) {
            res.status(404).json({ message: 'Lead not found' });
            return;
        }

        res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
