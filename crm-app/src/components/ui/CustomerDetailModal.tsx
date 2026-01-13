'use client';

import { Modal, Button, Badge } from '@/components/ui';
import { Phone, Mail, Globe, Building2, DollarSign, TrendingUp, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CustomerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: any;
}

const lifecycleConfig: any = {
    lead: { label: 'Lead', variant: 'info' },
    prospect: { label: 'Prospect', variant: 'warning' },
    customer: { label: 'Customer', variant: 'success' },
    churned: { label: 'Churned', variant: 'error' },
};

export function CustomerDetailModal({ isOpen, onClose, customer }: CustomerDetailModalProps) {
    if (!customer) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Customer Details"
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <Button onClick={() => window.location.href = `mailto:${customer.email}`}>
                        <Mail size={16} /> Contact
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}
                    >
                        <Building2 size={32} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {customer.name}
                        </h2>
                        <div className="text-sm text-gray-500 mt-1">{customer.industry}</div>
                        <Badge variant={lifecycleConfig[customer.lifecycle]?.variant || 'neutral'} className="mt-2">
                            {lifecycleConfig[customer.lifecycle]?.label || customer.lifecycle}
                        </Badge>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(customer.totalRevenue || 0)}</div>
                        <div className="text-xs text-gray-500">Total Revenue</div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{customer.totalDeals || 0}</div>
                        <div className="text-xs text-gray-500">Total Deals</div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {customer.totalDeals > 0 ? formatCurrency((customer.totalRevenue || 0) / customer.totalDeals) : '₹0'}
                        </div>
                        <div className="text-xs text-gray-500">Avg Deal Value</div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                            <Mail size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.email}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                            <Phone size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Phone</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.phone || 'N/A'}</div>
                        </div>
                    </div>
                    {customer.website && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                                <Globe size={18} className="text-gray-500" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Website</div>
                                <a
                                    href={`https://${customer.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-primary-600 hover:underline"
                                >
                                    {customer.website}
                                </a>
                            </div>
                        </div>
                    )}
                    {customer.owner && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                                <User size={18} className="text-gray-500" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Account Owner</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {customer.owner.firstName} {customer.owner.lastName}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
