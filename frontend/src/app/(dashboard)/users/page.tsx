'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Search,
    Plus,
    Building2,
    UserCheck,
    UserX,
    Shield,
    Users,
    MoreHorizontal,
    Mail,
} from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    MANAGER: { label: 'Manager', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    EMPLOYEE: { label: 'Employee', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

export default function UsersPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');

    const { data: users, isLoading } = useQuery({
        queryKey: ['users', search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            const response = await apiClient.get(`/users?${params.toString()}`);
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const activeUsers = users?.filter((u: any) => u.isActive) || [];
    const inactiveUsers = users?.filter((u: any) => !u.isActive) || [];

    return (
        <div className="space-y-6 page-enter">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Users</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your team members and permissions
                    </p>
                </div>
                {user?.role === 'SUPER_ADMIN' && (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add User
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-blue-50">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{users?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-emerald-50">
                                <UserCheck className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeUsers.length}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-purple-50">
                                <Shield className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {users?.filter((u: any) => u.role === 'MANAGER').length || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Managers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-amber-50">
                                <UserX className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{inactiveUsers.length}</p>
                                <p className="text-sm text-muted-foreground">Inactive</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Manager</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((u: any) => {
                                const role = roleConfig[u.role] || roleConfig.EMPLOYEE;

                                return (
                                    <TableRow key={u.id} className="table-row-hover">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                        {getInitials(u.firstName, u.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">
                                                        {u.firstName} {u.lastName}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(role.bg, role.color, 'border')}>
                                                {role.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {u.manager ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(u.manager.firstName, u.manager.lastName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">
                                                        {u.manager.firstName} {u.manager.lastName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={u.isActive ? 'default' : 'secondary'}>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(u.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Mail className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {(!users || users.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Users className="h-10 w-10 mb-2 opacity-50" />
                                            <p>No users found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
