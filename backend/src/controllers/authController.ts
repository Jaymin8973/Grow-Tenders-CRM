import { Response } from 'express';
import { AuthRequest, generateToken } from '../middleware';
import { User } from '../models';

// Login
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        if (user.status !== 'active') {
            res.status(401).json({ message: 'Account is not active' });
            return;
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id.toString());

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                branchId: user.branchId,
                branchName: user.branchName,
                teamId: user.teamId,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Register (Super Admin or Manager)
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { email, password, firstName, lastName, role, branchId, branchName } = req.body;

        if (!email || !password || !firstName || !lastName) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        // Permission checks
        if (req.user?.role === 'manager') {
            // Manager can only create employees
            if (role !== 'employee') {
                res.status(403).json({ message: 'Managers can only create Employee accounts' });
                return;
            }
            // Manager can only create for their branch
            if (branchId !== req.user.branchId) {
                res.status(403).json({ message: 'Managers can only create users for their own branch' });
                return;
            }
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const user = new User({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            role: role || 'employee',
            branchId,
            branchName,
            status: 'active',
        });

        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        res.json({
            user: {
                id: req.user?._id,
                email: req.user?.email,
                firstName: req.user?.firstName,
                lastName: req.user?.lastName,
                role: req.user?.role,
                branchId: req.user?.branchId,
                branchName: req.user?.branchName,
                teamId: req.user?.teamId,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
