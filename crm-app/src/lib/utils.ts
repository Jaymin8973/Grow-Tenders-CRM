import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export function formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
}

export type Role = 'super_admin' | 'manager' | 'employee';

// Branch interface for multi-branch organization
export interface Branch {
    id: string;
    name: string;
    code: string;
    address?: string;
    managerId?: string;
}

// Predefined branches
export const BRANCHES: Branch[] = [
    { id: 'branch-del', name: 'Delhi Branch', code: 'DEL', address: 'New Delhi, India' },
    { id: 'branch-mum', name: 'Mumbai Branch', code: 'MUM', address: 'Mumbai, India' },
];

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    branchId?: string;     // Required for manager and employee
    branchName?: string;   // For display purposes
    avatar?: string;
    teamId?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
    super_admin: 'Super Admin',
    manager: 'Manager',
    employee: 'Employee',
};

// Helper to get branch by ID
export function getBranchById(branchId: string): Branch | undefined {
    return BRANCHES.find(b => b.id === branchId);
}

// Helper to get branch name by ID
export function getBranchName(branchId?: string): string {
    if (!branchId) return 'All Branches';
    const branch = getBranchById(branchId);
    return branch?.name || 'Unknown Branch';
}
