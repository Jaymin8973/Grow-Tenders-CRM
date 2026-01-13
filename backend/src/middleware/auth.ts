import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({ message: 'No token, authorization denied' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.status(401).json({ message: 'Token is not valid' });
            return;
        }

        if (user.status !== 'active') {
            res.status(401).json({ message: 'User account is not active' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

export const generateToken = (userId: string): string => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};
