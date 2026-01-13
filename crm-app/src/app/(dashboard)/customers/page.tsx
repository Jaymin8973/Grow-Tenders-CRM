'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    MoreHorizontal,
    Building2,
    Phone,
    Mail,
    Globe,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCcw,
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input, CustomerDetailModal, AddCustomerModal } from '@/components/ui';
import type { CustomerFormData } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';

interface Customer {
    _id: string;
    name: string;
    type: 'company' | 'individual';
    email: string;
    phone?: string;
    website?: string;
    industry: string;
    lifecycle: 'lead' | 'prospect' | 'customer' | 'churned';
    totalDeals: number;
    totalRevenue: number;
    owner?: { firstName: string; lastName: string };
}

interface Stats {
    totalCustomers: number;
    totalRevenue: number;
    avgDealValue: number;
    activeProspects: number;
}

const lifecycleConfig = {
    lead: { label: 'Lead', variant: 'info' as const },
    prospect: { label: 'Prospect', variant: 'warning' as const },
    customer: { label: 'Customer', variant: 'success' as const },
    churned: { label: 'Churned', variant: 'error' as const },
};

export default function CustomersPage() {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<{ page: number; pages: number; total: number } | null>(null);

    // Detail modal
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const filters: Record<string, string> = { page: String(currentPage), limit: '12' };
            if (lifecycleFilter !== 'all') filters.lifecycle = lifecycleFilter;

            const response = await api.getCustomers(filters);
            setCustomers(response.customers || []);
            setStats(response.stats || null);
            setPagination(response.pagination || null);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCustomers();
        }
    }, [user, currentPage, lifecycleFilter]);

    const handleCreateCustomer = async (formData: CustomerFormData) => {
        try {
            await api.createCustomer(formData as unknown as Record<string, unknown>);
            setIsAddModalOpen(false);
            fetchCustomers();
        } catch (error) {
            console.error('Failed to create customer:', error);
            alert('Failed to create customer');
        }
    };

    // Filter locally for search
    const filteredCustomers = customers.filter((c) => {
        const matchesSearch =
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.industry.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    if (loading && customers.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading customers...</p>
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
                        {user?.role === 'employee' ? 'My Customers' : 'Customer Directory'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage your customer relationships
                        {user?.branchName && ` · ${user.branchName}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={fetchCustomers} title="Refresh">
                        <RefreshCcw size={18} />
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={18} />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Customers</div>
                    <div className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stats?.totalCustomers || 0}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Total Revenue</div>
                    <div className="text-2xl font-bold mt-1" style={{ color: 'var(--success-500)' }}>
                        {formatCurrency(stats?.totalRevenue || 0)}
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Avg Deal Value</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(stats?.avgDealValue || 0)}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Active Prospects</div>
                    <div className="text-2xl font-bold mt-1">{stats?.activeProspects || 0}</div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                        <div
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                            style={{ borderColor: 'var(--border-color)' }}
                        >
                            <Search size={18} style={{ color: 'var(--foreground-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search customers by name, email, or industry..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-sm"
                            />
                        </div>
                    </div>

                    <select
                        value={lifecycleFilter}
                        onChange={(e) => {
                            setLifecycleFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    >
                        <option value="all">All Lifecycle</option>
                        <option value="lead">Lead</option>
                        <option value="prospect">Prospect</option>
                        <option value="customer">Customer</option>
                        <option value="churned">Churned</option>
                    </select>
                </div>
            </Card>

            {/* Customers Grid */}
            <div className="grid grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => (
                    <Card key={customer._id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                                    style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}
                                >
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <div className="font-semibold">{customer.name}</div>
                                    <Badge variant={lifecycleConfig[customer.lifecycle]?.variant || 'neutral'}>
                                        {lifecycleConfig[customer.lifecycle]?.label || customer.lifecycle}
                                    </Badge>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal size={16} />
                            </Button>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2" style={{ color: 'var(--foreground-muted)' }}>
                                <Mail size={14} />
                                <span>{customer.email}</span>
                            </div>
                            {customer.phone && (
                                <div className="flex items-center gap-2" style={{ color: 'var(--foreground-muted)' }}>
                                    <Phone size={14} />
                                    <span>{customer.phone}</span>
                                </div>
                            )}
                            {customer.website && (
                                <div className="flex items-center gap-2" style={{ color: 'var(--foreground-muted)' }}>
                                    <Globe size={14} />
                                    <span>{customer.website}</span>
                                </div>
                            )}
                        </div>

                        <div
                            className="flex items-center justify-between pt-4 border-t"
                            style={{ borderColor: 'var(--border-color)' }}
                        >
                            <div>
                                <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                    Total Revenue
                                </div>
                                <div className="font-semibold" style={{ color: 'var(--success-500)' }}>
                                    {formatCurrency(customer.totalRevenue)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                    Deals
                                </div>
                                <div className="font-semibold">{customer.totalDeals}</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredCustomers.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                    No customers found matching your filters.
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Showing {pagination.total} customers
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

            {/* Add Customer Modal */}
            <AddCustomerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleCreateCustomer}
            />

            {/* Customer Detail Modal */}
            <CustomerDetailModal
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                customer={selectedCustomer}
            />
        </div>
    );
}
