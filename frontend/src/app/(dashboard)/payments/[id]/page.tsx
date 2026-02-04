'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CreditCard,
    IndianRupee,
    Phone,
    Receipt,
    User,
    Wallet,
    Banknote,
    FileText,
    Edit,
    CheckCircle2,
    Clock,
    MapPin,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

const paymentMethodConfig: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
    CASH: { label: 'Cash', icon: Banknote, color: 'text-green-600', bg: 'bg-gradient-to-br from-green-50 to-emerald-100', border: 'border-green-200' },
    BANK_TRANSFER: { label: 'Bank Transfer', icon: Building2, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-indigo-100', border: 'border-blue-200' },
    CHEQUE: { label: 'Cheque', icon: Receipt, color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-50 to-violet-100', border: 'border-purple-200' },
    UPI: { label: 'UPI', icon: Wallet, color: 'text-orange-600', bg: 'bg-gradient-to-br from-orange-50 to-amber-100', border: 'border-orange-200' },
    CARD: { label: 'Card', icon: CreditCard, color: 'text-pink-600', bg: 'bg-gradient-to-br from-pink-50 to-rose-100', border: 'border-pink-200' },
    OTHER: { label: 'Other', icon: Wallet, color: 'text-gray-600', bg: 'bg-gradient-to-br from-gray-50 to-slate-100', border: 'border-gray-200' },
};

const gstTypeConfig: Record<string, { label: string; bg: string; color: string }> = {
    WITH_GST: { label: 'With GST', bg: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-700' },
    WITHOUT_GST: { label: 'Without GST', bg: 'bg-slate-50 border-slate-200', color: 'text-slate-700' },
};

const referenceTypeConfig: Record<string, { label: string; bg: string; color: string }> = {
    INTERNAL: { label: 'Internal Customer', bg: 'bg-blue-50 border-blue-200', color: 'text-blue-700' },
    EXTERNAL: { label: 'External Customer', bg: 'bg-amber-50 border-amber-200', color: 'text-amber-700' },
};

export default function PaymentDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const paymentId = params.id as string;
    const { user } = useAuth();

    const { data: payment, isLoading } = useQuery({
        queryKey: ['payment', paymentId],
        queryFn: async () => {
            const response = await apiClient.get(`/payments/${paymentId}`);
            return response.data;
        },
        enabled: !!paymentId,
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h2 className="text-xl font-semibold">Payment not found</h2>
                    <p className="text-muted-foreground mt-2">The payment you're looking for doesn't exist.</p>
                    <Button className="mt-4" onClick={() => router.push('/payments')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Payments
                    </Button>
                </div>
            </div>
        );
    }

    const method = paymentMethodConfig[payment.paymentMethod] || paymentMethodConfig.OTHER;
    const gstType = gstTypeConfig[payment.gstType] || gstTypeConfig.WITHOUT_GST;
    const refType = referenceTypeConfig[payment.referenceType] || referenceTypeConfig.INTERNAL;
    const MethodIcon = method.icon;

    const getDisplayName = () => {
        if (payment.referenceType === 'INTERNAL' && payment.customer) {
            return `${payment.customer.firstName} ${payment.customer.lastName}`;
        }
        return payment.customerName || 'N/A';
    };

    const getDisplayCompany = () => {
        if (payment.referenceType === 'INTERNAL' && payment.customer) {
            return payment.customer.company || '-';
        }
        return payment.companyName || '-';
    };

    const getDisplayPhone = () => {
        if (payment.referenceType === 'INTERNAL' && payment.customer) {
            return payment.customer.phone || '-';
        }
        return payment.phone || '-';
    };

    return (
        <div className="space-y-6 page-enter max-w-6xl mx-auto">
            {/* Header Card */}
            <Card className="overflow-hidden border-0 shadow-lg">
                <div className="bg-gradient-to-r from-primary/90 to-primary p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push('/payments')}
                                className="text-white hover:bg-white/20"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl sm:text-2xl font-bold">{payment.paymentNumber}</h1>
                                    <Badge className="bg-white/20 text-white border-white/30 text-xs">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Completed
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-white/80 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => router.push(`/payments/${paymentId}/edit`)}
                            className="shadow-md"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Payment
                        </Button>
                    </div>
                </div>

                {/* Amount Display */}
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                        <div className="text-center sm:text-left">
                            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Total Amount Received</p>
                            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">
                                {formatCurrency(payment.totalAmount)}
                            </p>
                        </div>
                        <div className={cn("p-3 rounded-xl border shadow-sm", method.bg, method.border)}>
                            <div className="flex items-center gap-2">
                                <MethodIcon className={cn("h-6 w-6", method.color)} />
                                <div>
                                    <p className="text-xs text-muted-foreground">Payment Method</p>
                                    <p className={cn("text-sm font-semibold", method.color)}>{method.label}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Customer Details */}
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-blue-50">
                                <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-semibold">Customer Details</h3>
                            <Badge variant="outline" className={cn(refType.bg, refType.color, 'border ml-auto')}>
                                {refType.label}
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{getDisplayName()}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground text-sm">
                                        <Building2 className="h-3 w-3" />
                                        <span>{getDisplayCompany()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-2 border rounded-lg">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="font-medium text-sm">{getDisplayPhone()}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Amount Breakdown */}
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-lg bg-emerald-50">
                                <IndianRupee className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h3 className="text-sm font-semibold">Amount Breakdown</h3>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                <span className="text-muted-foreground text-sm">Base Amount</span>
                                <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                            </div>

                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-sm">GST</span>
                                    <Badge variant="outline" className={cn(gstType.bg, gstType.color, 'border text-xs')}>
                                        {gstType.label}
                                    </Badge>
                                </div>
                                <span className="font-semibold">
                                    {payment.gstType === 'WITH_GST'
                                        ? `${formatCurrency(payment.gstAmount)} (${payment.gstPercentage}%)`
                                        : '₹0'}
                                </span>
                            </div>

                            <div className="border-t border-dashed my-1" />

                            <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                <span className="font-semibold text-emerald-700 text-sm">Total Amount</span>
                                <span className="font-bold text-lg text-emerald-600">{formatCurrency(payment.totalAmount)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Info Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Payment Date */}
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-violet-50">
                                <Calendar className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Date</p>
                                <p className="font-semibold">
                                    {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Collected By */}
                {payment.collectedBy && (
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Collected By</p>
                                    <p className="font-semibold text-sm">
                                        {payment.collectedBy.firstName} {payment.collectedBy.lastName}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Created At */}
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-100">
                                <Clock className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Recorded On</p>
                                <p className="font-semibold">
                                    {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notes */}
            {payment.notes && (
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-amber-50">
                                <FileText className="h-4 w-4 text-amber-600" />
                            </div>
                            <h3 className="text-sm font-semibold">Notes</h3>
                        </div>
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{payment.notes}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
