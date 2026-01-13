'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    Phone,
    Mail,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    RefreshCcw,
} from 'lucide-react';
import { Button, Card, Badge, Avatar, Modal, Input, LeadAssignModal, LeadDetailModal } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { formatDate, cn } from '@/lib/utils';
import { api } from '@/lib/api';

const statusConfig: any = {
    new: { label: 'New', variant: 'info' },
    contacted: { label: 'Contacted', variant: 'warning' },
    qualified: { label: 'Qualified', variant: 'success' },
    unqualified: { label: 'Unqualified', variant: 'error' },
    proposal: { label: 'Proposal', variant: 'primary' },
    negotiation: { label: 'Negotiation', variant: 'secondary' },
    closed_won: { label: 'Won', variant: 'success' },
    closed_lost: { label: 'Lost', variant: 'error' },
};

const leadTypeColors: any = {
    hot: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    warm: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
};

export default function LeadsPage() {
    const { user, hasRole } = useAuth();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);

    // Selection for bulk actions
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

    // Assignment modal
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignTargetId, setAssignTargetId] = useState<string | undefined>(undefined);

    // Detail modal
    const [selectedLead, setSelectedLead] = useState<any>(null);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const filters: any = { page: currentPage, limit: 10 };
            if (statusFilter !== 'all') filters.status = statusFilter;
            if (typeFilter !== 'all') filters.leadType = typeFilter;

            const data = await api.getLeads(filters);
            setLeads(data.leads);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch leads when user is available or filters change
        if (user) fetchLeads();
    }, [user, currentPage, statusFilter, typeFilter]);

    // Handle selection
    const toggleSelectAll = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(l => l._id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(l => l !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    // Open assign modal (single)
    const handleAssignClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setAssignTargetId(id);
        setAssignModalOpen(true);
    };

    // Open assign modal (bulk)
    const handleBulkAssign = () => {
        setAssignTargetId(undefined);
        setAssignModalOpen(true);
    };

    // Handle new lead creation
    const handleCreateLead = async (formData: any) => {
        try {
            await api.createLead(formData);
            setIsAddModalOpen(false);
            fetchLeads();
        } catch (error) {
            alert('Failed to create lead');
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user?.role === 'employee' ? 'My Leads' : 'Lead Management'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {user?.role === 'manager'
                            ? 'Manage team leads and assignment'
                            : 'Track and manage your sales leads'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {hasRole(['manager', 'super_admin']) && selectedLeads.length > 0 && (
                        <Button variant="secondary" onClick={handleBulkAssign}>
                            <UserPlus size={18} />
                            Assign Selected ({selectedLeads.length})
                        </Button>
                    )}
                    {hasRole(['manager', 'super_admin']) && (
                        <Button onClick={() => setIsAddModalOpen(true)}>
                            <Plus size={18} />
                            Add Lead
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary-500/20">
                            <Search size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        {Object.entries(statusConfig).map(([key, config]: any) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    >
                        <option value="all">All Types</option>
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                    </select>

                    <Button variant="ghost" size="icon" onClick={fetchLeads} title="Refresh">
                        <RefreshCcw size={18} />
                    </Button>
                </div>
            </Card>

            {/* Leads Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                                        checked={leads.length > 0 && selectedLeads.length === leads.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-4 py-3">Lead</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">Assigned To</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        Loading leads...
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        No leads found.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead._id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                                                checked={selectedLeads.includes(lead._id)}
                                                onChange={() => toggleSelect(lead._id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={`${lead.firstName} ${lead.lastName}`} size="sm" />
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {lead.firstName} {lead.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {lead.company || lead.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider",
                                                leadTypeColors[lead.leadType] || 'bg-gray-100 text-gray-600'
                                            )}>
                                                {lead.leadType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={statusConfig[lead.status]?.variant || 'neutral'}>
                                                {statusConfig[lead.status]?.label || lead.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                    <div
                                                        className={cn(
                                                            "h-1.5 rounded-full",
                                                            lead.score >= 80 ? 'bg-green-500' :
                                                                lead.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                                        )}
                                                        style={{ width: `${lead.score}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-600 dark:text-gray-400">{lead.score}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {lead.assignedTo ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar name={`${lead.assignedTo?.firstName || ''} ${lead.assignedTo?.lastName || ''}`} size="sm" />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {lead.assignedTo?.firstName || 'Assigned'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                                            {formatDate(lead.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                {hasRole('manager') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-primary-600"
                                                        onClick={(e) => handleAssignClick(lead._id, e)}
                                                    >
                                                        Assign
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Page {pagination.page} of {pagination.pages}
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
            </Card>

            {/* Assignment Modal */}
            <LeadAssignModal
                isOpen={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                leadId={assignTargetId}
                leadIds={!assignTargetId ? selectedLeads : undefined}
                onAssign={() => {
                    fetchLeads();
                    setSelectedLeads([]);
                }}
            />

            {/* Add Lead Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Lead"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                const form = document.getElementById('add-lead-form') as HTMLFormElement;
                                if (form) form.requestSubmit();
                            }}
                        >
                            Create Lead
                        </Button>
                    </>
                }
            >
                <form id="add-lead-form" className="space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleCreateLead({
                        firstName: formData.get('firstName'),
                        lastName: formData.get('lastName'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        company: formData.get('company'),
                        leadType: formData.get('leadType'),
                        status: formData.get('status'),
                        score: Number(formData.get('score')) || 50
                    });
                }}>
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="firstName" label="First Name" placeholder="John" required />
                        <Input name="lastName" label="Last Name" placeholder="Doe" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input name="email" label="Email" type="email" placeholder="john@example.com" required />
                        <Input name="phone" label="Phone" placeholder="+91 98765 43210" />
                    </div>

                    <Input name="company" label="Company" placeholder="Acme Corp" />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Lead Type
                            </label>
                            <select
                                name="leadType"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                defaultValue="cold"
                            >
                                <option value="hot">Hot</option>
                                <option value="warm">Warm</option>
                                <option value="cold">Cold</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Initial Status
                            </label>
                            <select
                                name="status"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                defaultValue="new"
                            >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Lead Detail Modal */}
            <LeadDetailModal
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                lead={selectedLead}
            />
        </div>
    );
}
