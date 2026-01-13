'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    MoreHorizontal,
    Upload,
    Download,
    Mail,
    Shield,
    UserCheck,
    UserX,
    ChevronLeft,
    ChevronRight,
    Building2,
    RefreshCcw,
} from 'lucide-react';
import { Button, Card, Badge, Avatar, Modal, Input } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { formatDate, ROLE_LABELS, BRANCHES } from '@/lib/utils';
import type { Role } from '@/lib/utils';
import { api } from '@/lib/api';

const statusConfig: any = {
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'error' },
    invited: { label: 'Invited', variant: 'warning' },
};

const roleColors: Record<Role, string> = {
    super_admin: 'bg-red-500',
    manager: 'bg-amber-500',
    employee: 'bg-blue-500',
};

export default function UsersPage() {
    const { user, hasRole } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Add User Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        branchId: '',
        role: 'employee',
        password: 'password123' // Default password for initial setup
    });
    const [submitting, setSubmitting] = useState(false);

    const canAccessPage = hasRole(['super_admin', 'manager']);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const filters: any = {};
            if (roleFilter !== 'all') filters.role = roleFilter;
            if (statusFilter !== 'all') filters.status = statusFilter;
            if (branchFilter !== 'all') filters.branchId = branchFilter;

            const response = await api.getUsers(filters);
            setUsers(response.users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (canAccessPage && user) {
            fetchUsers();
        }
    }, [user, roleFilter, statusFilter, branchFilter]);

    const handleCreateUser = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.branchId) {
            alert('Please fill all required fields');
            return;
        }

        try {
            setSubmitting(true);
            const branch = BRANCHES.find(b => b.id === formData.branchId);

            await api.register({
                ...formData,
                branchName: branch?.name
            });

            setIsAddModalOpen(false);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                branchId: '',
                role: 'employee',
                password: 'password123'
            });
            fetchUsers();
        } catch (error: any) {
            console.error('Failed to create user:', error);
            alert(error.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!canAccessPage && user?.role === 'employee') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="p-8 text-center max-w-md">
                    <Shield size={48} className="mx-auto mb-4 text-red-500" />
                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Access Restricted</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        You can only view users from your branch ({user?.branchName || 'Unknown'}).
                        Contact your manager for more access.
                    </p>
                </Card>
            </div>
        );
    }

    // Filter locally for search
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Valid branches for selection (Manager can only select their own)
    const availableBranches = user?.role === 'manager'
        ? BRANCHES.filter(b => b.id === user.branchId)
        : BRANCHES;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 size={24} />
                        User Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage users across branches
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={fetchUsers} title="Refresh">
                        <RefreshCcw size={18} />
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={18} />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <Search size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {user?.role === 'super_admin' && (
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        >
                            <option value="all">All Branches</option>
                            {BRANCHES.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    )}

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    >
                        <option value="all">All Roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </Card>

            {/* Users Table */}
            <Card>
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Role</th>
                                    <th className="px-4 py-3 text-left">Branch</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Joined</th>
                                    <th className="px-4 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.map((userData) => (
                                    <tr key={userData._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={`${userData.firstName} ${userData.lastName}`} size="sm" />
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {userData.firstName} {userData.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {userData.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${roleColors[userData.role as Role]}`} />
                                                <span className="capitalize">{userData.role?.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {userData.branchName || 'All Branches'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={statusConfig[userData.status]?.variant || 'neutral'}>
                                                {userData.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {formatDate(userData.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No users found matching your filters.</div>
                        )}
                    </div>
                )}
            </Card>

            {/* Add User Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New User"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateUser} disabled={submitting}>
                            {submitting ? 'Creating...' : 'Create User'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            placeholder="Amit"
                            value={formData.firstName}
                            onChange={(e) => handleChange('firstName', e.target.value)}
                        />
                        <Input
                            label="Last Name"
                            placeholder="Kumar"
                            value={formData.lastName}
                            onChange={(e) => handleChange('lastName', e.target.value)}
                        />
                    </div>
                    <Input
                        label="Email"
                        type="email"
                        placeholder="amit.kumar@company.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="Initial password"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                    />

                    {/* Branch Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Branch <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={formData.branchId}
                            onChange={(e) => handleChange('branchId', e.target.value)}
                        >
                            <option value="">Select Branch</option>
                            {availableBranches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Role
                        </label>
                        <select
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={formData.role}
                            onChange={(e) => handleChange('role', e.target.value)}
                        >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            {user?.role === 'super_admin' && (
                                <option value="super_admin">Super Admin</option>
                            )}
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
