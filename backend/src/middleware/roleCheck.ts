import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Role } from '../models';

export const requireRole = (...allowedRoles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                message: 'Access denied. Insufficient permissions.',
                requiredRoles: allowedRoles,
                yourRole: req.user.role
            });
            return;
        }

        next();
    };
};

// Convenience functions
export const requireSuperAdmin = requireRole('super_admin');
export const requireManager = requireRole('super_admin', 'manager');
export const requireEmployee = requireRole('super_admin', 'manager', 'employee');
