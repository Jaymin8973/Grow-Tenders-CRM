'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    MoreHorizontal,
    Phone,
    Mail,
    Calendar,
    Video,
    FileText,
    Check,
    Clock,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCcw,
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface FollowUp {
    id: string;
    title: string;
    type: 'call' | 'email' | 'meeting' | 'task';
    contact: {
        name: string;
        company: string;
        email?: string;
    };
    dueDate: string;
    dueTime: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'completed' | 'overdue' | 'cancelled';
    notes?: string;
    assignedTo: string;
}

interface Stats {
    dueToday: number;
    overdue: number;
    completedThisWeek: number;
    totalPending: number;
}

const typeConfig = {
    call: { icon: Phone, label: 'Call', bg: 'var(--info-50)', color: 'var(--info-600)' },
    email: { icon: Mail, label: 'Email', bg: 'var(--success-50)', color: 'var(--success-600)' },
    meeting: { icon: Video, label: 'Meeting', bg: 'var(--warning-50)', color: 'var(--warning-600)' },
    task: { icon: FileText, label: 'Task', bg: 'var(--primary-50)', color: 'var(--primary-600)' },
};

const priorityConfig = {
    high: { label: 'High', variant: 'error' as const },
    medium: { label: 'Medium', variant: 'warning' as const },
    low: { label: 'Low', variant: 'neutral' as const },
};

const statusConfig = {
    pending: { label: 'Pending', variant: 'warning' as const, icon: Clock },
    completed: { label: 'Completed', variant: 'success' as const, icon: Check },
    overdue: { label: 'Overdue', variant: 'error' as const, icon: AlertCircle },
    cancelled: { label: 'Cancelled', variant: 'neutral' as const, icon: AlertCircle },
};

export default function FollowUpsPage() {
    const { user } = useAuth();
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<{ page: number; pages: number; total: number } | null>(null);

    const fetchFollowUps = async () => {
        try {
            setLoading(true);
            const filters: Record<string, string> = { page: String(currentPage), limit: '15' };
            if (statusFilter !== 'all') filters.status = statusFilter;

            const response = await api.getFollowUps(filters);
            setFollowUps(response.followUps || []);
            setStats(response.stats || null);
            setPagination(response.pagination || null);
        } catch (error) {
            console.error('Failed to fetch follow-ups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchFollowUps();
        }
    }, [user, currentPage, statusFilter]);

    const handleComplete = async (id: string) => {
        try {
            await api.completeFollowUp(id);
            fetchFollowUps();
        } catch (error) {
            console.error('Failed to complete follow-up:', error);
        }
    };

    const handleCreateFollowUp = async (formData: Record<string, unknown>) => {
        try {
            await api.createFollowUp(formData);
            setIsAddModalOpen(false);
            fetchFollowUps();
        } catch (error) {
            console.error('Failed to create follow-up:', error);
            alert('Failed to create follow-up');
        }
    };

    if (loading && followUps.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading follow-ups...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Follow-ups & Reminders
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Track your scheduled tasks and follow-up activities
                        {user?.branchName && ` · ${user.branchName}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={fetchFollowUps} title="Refresh">
                        <RefreshCcw size={18} />
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={18} />
                        Schedule Follow-up
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--warning-50)' }}>
                        <Clock size={20} style={{ color: 'var(--warning-600)' }} />
                    </div>
                    <div>
                        <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Due Today</div>
                        <div className="text-2xl font-bold">{stats?.dueToday || 0}</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--error-50)' }}>
                        <AlertCircle size={20} style={{ color: 'var(--error-600)' }} />
                    </div>
                    <div>
                        <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Overdue</div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--error-600)' }}>{stats?.overdue || 0}</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--success-50)' }}>
                        <Check size={20} style={{ color: 'var(--success-600)' }} />
                    </div>
                    <div>
                        <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Completed This Week</div>
                        <div className="text-2xl font-bold">{stats?.completedThisWeek || 0}</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--primary-50)' }}>
                        <Calendar size={20} style={{ color: 'var(--primary-600)' }} />
                    </div>
                    <div>
                        <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Total Pending</div>
                        <div className="text-2xl font-bold">{stats?.totalPending || 0}</div>
                    </div>
                </Card>
            </div>

            {/* Filter Tabs */}
            <Card className="p-4">
                <div className="flex gap-2">
                    {['all', 'pending', 'completed', 'overdue'].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => {
                                setStatusFilter(status);
                                setCurrentPage(1);
                            }}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                    ))}
                </div>
            </Card>

            {/* Follow-ups List */}
            <div className="space-y-3">
                {followUps.map((followUp) => {
                    const type = typeConfig[followUp.type] || typeConfig.task;
                    const Icon = type.icon;
                    const status = statusConfig[followUp.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const priority = priorityConfig[followUp.priority] || priorityConfig.medium;

                    return (
                        <Card
                            key={followUp.id}
                            className="p-4 hover:shadow-md transition-shadow"
                            style={{ opacity: followUp.status === 'completed' ? 0.7 : 1 }}
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: type.bg, color: type.color }}
                                >
                                    <Icon size={20} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div
                                                className="font-medium"
                                                style={{
                                                    textDecoration: followUp.status === 'completed' ? 'line-through' : 'none',
                                                    color: followUp.status === 'completed' ? 'var(--foreground-muted)' : undefined,
                                                }}
                                            >
                                                {followUp.title}
                                            </div>
                                            <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                                {followUp.contact.name} · {followUp.contact.company}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={priority.variant}>{priority.label}</Badge>
                                            <Badge variant={status.variant}>
                                                <StatusIcon size={12} className="mr-1" />
                                                {status.label}
                                            </Badge>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal size={16} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-3 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            <span>{formatDate(followUp.dueDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>{followUp.dueTime}</span>
                                        </div>
                                    </div>

                                    {followUp.notes && (
                                        <div className="text-sm mt-2" style={{ color: 'var(--foreground-muted)' }}>
                                            {followUp.notes}
                                        </div>
                                    )}
                                </div>

                                {followUp.status === 'pending' && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleComplete(followUp.id)}
                                    >
                                        <Check size={16} />
                                        Complete
                                    </Button>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {followUps.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                    No follow-ups found matching your filters.
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Showing {pagination.total} follow-ups
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => setCurrentPage(pagination.page - 1)}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="text-sm px-2">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setCurrentPage(pagination.page + 1)}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Add Follow-up Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Schedule Follow-up"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                const form = document.getElementById('add-followup-form') as HTMLFormElement;
                                if (form) form.requestSubmit();
                            }}
                        >
                            Schedule
                        </Button>
                    </>
                }
            >
                <form
                    id="add-followup-form"
                    className="grid grid-cols-2 gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleCreateFollowUp({
                            title: formData.get('title'),
                            type: formData.get('type'),
                            contactName: formData.get('contactName'),
                            contactCompany: formData.get('contactCompany'),
                            contactEmail: formData.get('contactEmail'),
                            dueDate: formData.get('dueDate'),
                            dueTime: formData.get('dueTime'),
                            priority: formData.get('priority') || 'medium',
                            notes: formData.get('notes'),
                        });
                    }}
                >
                    <Input name="title" label="Title" placeholder="Follow-up title" className="col-span-2" required />
                    <div className="input-group">
                        <label className="input-label">Type</label>
                        <select name="type" className="input w-full" required>
                            <option value="call">Call</option>
                            <option value="email">Email</option>
                            <option value="meeting">Meeting</option>
                            <option value="task">Task</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Priority</label>
                        <select name="priority" className="input w-full">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <Input name="contactName" label="Contact Name" placeholder="Contact Name" required />
                    <Input name="contactCompany" label="Company" placeholder="Company Name" required />
                    <Input name="contactEmail" label="Email" type="email" placeholder="contact@company.com" />
                    <Input name="dueDate" label="Due Date" type="date" required />
                    <Input name="dueTime" label="Due Time" type="time" required />
                    <Input name="notes" label="Notes" placeholder="Additional notes..." className="col-span-2" />
                </form>
            </Modal>
        </div>
    );
}
