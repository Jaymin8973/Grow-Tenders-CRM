'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    Building2,
    User,
    FileText,
    Loader2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

const stageConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    QUALIFICATION: { label: 'Qualification', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
    NEEDS_ANALYSIS: { label: 'Needs Analysis', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
    PROPOSAL: { label: 'Proposal', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300' },
    NEGOTIATION: { label: 'Negotiation', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
    CLOSED_WON: { label: 'Closed Won', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' },
    CLOSED_LOST: { label: 'Closed Lost', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
};

const stages = ['QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

export default function DealDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const dealId = params.id as string;

    const { data: deal, isLoading } = useQuery({
        queryKey: ['deal', dealId],
        queryFn: async () => {
            const res = await apiClient.get(`/deals/${dealId}`);
            return res.data;
        },
    });

    const updateStageMutation = useMutation({
        mutationFn: async (stage: string) => {
            return apiClient.patch(`/deals/${dealId}/stage`, { stage });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
            queryClient.invalidateQueries({ queryKey: ['deals'] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="flex h-full flex-col items-center justify-center">
                <p className="text-muted-foreground">Deal not found</p>
                <Button variant="link" onClick={() => router.push('/deals')}>
                    Back to Deals
                </Button>
            </div>
        );
    }

    const stage = stageConfig[deal.stage] || stageConfig.QUALIFICATION;

    const canCreateInvoice = (user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && deal.stage === 'CLOSED_WON';

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/deals')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{deal.title}</h1>
                        <Badge className={cn(stage.bg, stage.color, 'border-0')}>{stage.label}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {deal.customer?.company || deal.lead?.company || 'No company'}
                    </p>
                </div>
                {canCreateInvoice && (
                    <Button className="gap-2" onClick={() => router.push(`/invoices/new?dealId=${deal.id}`)}>
                        <FileText className="h-4 w-4" />
                        Create Invoice
                    </Button>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Deal Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <DollarSign className="h-4 w-4" />
                                    Value
                                </div>
                                <div className="font-bold">{formatCurrency(deal.value || 0)}</div>
                            </div>
                            {deal.expectedCloseDate && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        Expected Close
                                    </div>
                                    <div className="font-medium">
                                        {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    Customer
                                </div>
                                <div>
                                    {deal.customer ? (
                                        <Button variant="link" className="p-0" onClick={() => router.push(`/customers/${deal.customer.id}`)}>
                                            {deal.customer.company || `${deal.customer.firstName} ${deal.customer.lastName}`}
                                        </Button>
                                    ) : (
                                        <span className="text-muted-foreground">None</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    Lead
                                </div>
                                <div>
                                    {deal.lead ? (
                                        <Button variant="link" className="p-0" onClick={() => router.push(`/leads/${deal.lead.id}`)}>
                                            {deal.lead.company || `${deal.lead.firstName} ${deal.lead.lastName}`}
                                        </Button>
                                    ) : (
                                        <span className="text-muted-foreground">None</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Update Stage</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {stages.map((s) => {
                                const cfg = stageConfig[s];
                                const active = deal.stage === s;
                                return (
                                    <Button
                                        key={s}
                                        variant={active ? 'default' : 'outline'}
                                        className={cn(active ? '' : `${cfg.bg} ${cfg.color}`)}
                                        onClick={() => updateStageMutation.mutate(s)}
                                        disabled={updateStageMutation.isPending || active}
                                    >
                                        {updateStageMutation.isPending && active ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : null}
                                        {cfg.label}
                                    </Button>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Invoices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deal.invoices && deal.invoices.length > 0 ? (
                                <div className="space-y-2">
                                    {deal.invoices.map((inv: any) => (
                                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-md border">
                                            <div className="font-medium">
                                                {inv.invoiceNumber || 'Invoice'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">{inv.status}</Badge>
                                                <Button size="sm" variant="outline" onClick={() => router.push(`/invoices/${inv.id}`)}>
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">No invoices yet</div>
                            )}
                            {canCreateInvoice && (
                                <div className="mt-3">
                                    <Button className="gap-2" onClick={() => router.push(`/invoices/new?dealId=${deal.id}`)}>
                                        <FileText className="h-4 w-4" />
                                        Create Invoice from Deal
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
