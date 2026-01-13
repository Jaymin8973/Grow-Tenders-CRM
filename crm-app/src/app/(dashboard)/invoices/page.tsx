'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Download,
    Mail,
    Eye,
    CheckCircle,
    Clock,
    AlertTriangle,
    Loader2,
    Send,
} from 'lucide-react';
import { Button, Card, Badge, Avatar, Modal, Input } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { SUBSCRIPTION_PLANS, calculateWithGST } from '@/lib/plans';

interface Invoice {
    _id: string;
    invoiceNumber: string;
    customerId: { _id: string; name: string; email: string };
    planId: string;
    planName: string;
    subtotal: number;
    gstRate: number;
    gstAmount: number;
    total: number;
    invoiceDate: string;
    dueDate: string;
    paidAt?: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    customerName: string;
    customerEmail: string;
    periodStart: string;
    periodEnd: string;
}

interface Stats {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalRevenue: number;
}

const statusConfig = {
    draft: { label: 'Draft', variant: 'neutral' as const, icon: FileText },
    sent: { label: 'Sent', variant: 'info' as const, icon: Mail },
    paid: { label: 'Paid', variant: 'success' as const, icon: CheckCircle },
    overdue: { label: 'Overdue', variant: 'error' as const, icon: AlertTriangle },
    cancelled: { label: 'Cancelled', variant: 'neutral' as const, icon: Clock },
};

export default function InvoicesPage() {
    const { user, hasRole } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const filters: Record<string, string> = {};
            if (statusFilter !== 'all') filters.status = statusFilter;

            const response = await api.getInvoices(filters);
            setInvoices(response.invoices || []);
            setStats(response.stats || null);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchInvoices();
    }, [user, statusFilter]);

    const handleMarkAsPaid = async (invoiceId: string) => {
        try {
            await api.updateInvoiceStatus(invoiceId, 'paid');
            fetchInvoices();
        } catch (error) {
            alert('Failed to update invoice status');
        }
    };

    const handleSendInvoice = async (invoiceId: string) => {
        try {
            await api.sendInvoiceEmail(invoiceId);
            fetchInvoices();
            alert('Invoice sent successfully!');
        } catch (error) {
            alert('Failed to send invoice');
        }
    };

    const viewInvoiceDetail = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDetailOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Invoices</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage customer subscription invoices</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-green-500">
                    <div className="text-sm text-gray-500">Total Collected</div>
                    <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats?.totalRevenue || 0)}
                    </div>
                    <div className="text-xs text-gray-400">{stats?.paid || 0} invoices paid</div>
                </Card>
                <Card className="p-4 border-l-4 border-l-blue-500">
                    <div className="text-sm text-gray-500">Pending</div>
                    <div className="text-2xl font-bold text-blue-600">{stats?.pending || 0}</div>
                    <div className="text-xs text-gray-400">Awaiting payment</div>
                </Card>
                <Card className="p-4 border-l-4 border-l-red-500">
                    <div className="text-sm text-gray-500">Overdue</div>
                    <div className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</div>
                    <div className="text-xs text-gray-400">Require follow-up</div>
                </Card>
                <Card className="p-4 border-l-4 border-l-orange-500">
                    <div className="text-sm text-gray-500">Total Invoices</div>
                    <div className="text-2xl font-bold text-orange-600">{stats?.total || 0}</div>
                    <div className="text-xs text-gray-400">All time</div>
                </Card>
            </div>

            {/* List */}
            <Card>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
                                        statusFilter === status
                                            ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                                            : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center">
                                        <Loader2 className="animate-spin inline-block mr-2" size={20} />
                                        Loading invoices...
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No invoices found. Invoices are auto-generated when customers subscribe.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-mono text-sm">{invoice.invoiceNumber}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar name={invoice.customerName} size="sm" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{invoice.customerName}</span>
                                                    <span className="text-xs text-gray-500">{invoice.customerEmail}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="info">{invoice.planName}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{formatDate(invoice.invoiceDate)}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold">{formatCurrency(invoice.total)}</div>
                                            <div className="text-xs text-gray-500">
                                                {formatCurrency(invoice.subtotal)} + {invoice.gstRate}% GST
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={statusConfig[invoice.status]?.variant || 'neutral'}>
                                                {statusConfig[invoice.status]?.label || invoice.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="View"
                                                    onClick={() => viewInvoiceDetail(invoice)}
                                                >
                                                    <Eye size={16} />
                                                </Button>
                                                {invoice.status === 'draft' && hasRole(['manager', 'super_admin']) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Send"
                                                        onClick={() => handleSendInvoice(invoice._id)}
                                                    >
                                                        <Send size={16} />
                                                    </Button>
                                                )}
                                                {['sent', 'overdue'].includes(invoice.status) && hasRole(['manager', 'super_admin']) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Mark as Paid"
                                                        className="text-green-600"
                                                        onClick={() => handleMarkAsPaid(invoice._id)}
                                                    >
                                                        <CheckCircle size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Invoice Detail Modal */}
            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title={`Invoice ${selectedInvoice?.invoiceNumber || ''}`}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>Close</Button>
                        {selectedInvoice?.status === 'draft' && (
                            <Button onClick={() => selectedInvoice && handleSendInvoice(selectedInvoice._id)}>
                                <Send size={16} /> Send Invoice
                            </Button>
                        )}
                    </>
                }
            >
                {selectedInvoice && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold">Grow Tenders</h2>
                                <p className="text-sm text-gray-500">Tender Notification Service</p>
                            </div>
                            <Badge variant={statusConfig[selectedInvoice.status]?.variant || 'neutral'} className="text-lg px-3 py-1">
                                {statusConfig[selectedInvoice.status]?.label}
                            </Badge>
                        </div>

                        {/* Customer & Dates */}
                        <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div>
                                <div className="text-xs text-gray-500 uppercase mb-1">Bill To</div>
                                <div className="font-semibold">{selectedInvoice.customerName}</div>
                                <div className="text-sm text-gray-500">{selectedInvoice.customerEmail}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 uppercase mb-1">Invoice Date</div>
                                <div>{formatDate(selectedInvoice.invoiceDate)}</div>
                                <div className="text-xs text-gray-500 mt-2">Due Date</div>
                                <div className={cn(
                                    selectedInvoice.status === 'overdue' && 'text-red-500 font-bold'
                                )}>
                                    {formatDate(selectedInvoice.dueDate)}
                                </div>
                            </div>
                        </div>

                        {/* Plan Details */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 font-medium text-sm">Plan Details</div>
                            <div className="p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold">{selectedInvoice.planName}</div>
                                        <div className="text-sm text-gray-500">
                                            {formatDate(selectedInvoice.periodStart)} - {formatDate(selectedInvoice.periodEnd)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{formatCurrency(selectedInvoice.subtotal)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Subtotal</span>
                                <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">GST ({selectedInvoice.gstRate}%)</span>
                                <span>{formatCurrency(selectedInvoice.gstAmount)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-t mt-2 font-bold text-lg">
                                <span>Total</span>
                                <span className="text-orange-600">{formatCurrency(selectedInvoice.total)}</span>
                            </div>
                        </div>

                        {selectedInvoice.paidAt && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                                <CheckCircle size={18} />
                                <span>Paid on {formatDate(selectedInvoice.paidAt)}</span>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
