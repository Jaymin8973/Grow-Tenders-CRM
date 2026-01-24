'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Plus,
    Briefcase,
    DollarSign,
    TrendingUp,
    MoreHorizontal,
    Calendar,
    LayoutGrid,
    List,
} from 'lucide-react';
import { formatCurrency, getInitials, cn } from '@/lib/utils';

const stageConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    QUALIFICATION: { label: 'Qualification', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
    NEEDS_ANALYSIS: { label: 'Needs Analysis', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
    PROPOSAL: { label: 'Proposal', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300' },
    NEGOTIATION: { label: 'Negotiation', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
    CLOSED_WON: { label: 'Closed Won', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300' },
    CLOSED_LOST: { label: 'Closed Lost', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
};

const stages = ['QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];

export default function DealsPage() {
    const { user } = useAuth();
    const [view, setView] = useState<'pipeline' | 'list'>('pipeline');

    const { data: deals, isLoading } = useQuery({
        queryKey: ['deals'],
        queryFn: async () => {
            const response = await apiClient.get('/deals');
            return response.data;
        },
    });

    const { data: stats } = useQuery({
        queryKey: ['deal-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/deals/stats');
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

    const getDealsByStage = (stage: string) =>
        deals?.filter((deal: any) => deal.stage === stage) || [];

    const totalValue = deals?.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) || 0;
    const wonDeals = deals?.filter((d: any) => d.stage === 'CLOSED_WON') || [];
    const wonValue = wonDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);

    return (
        <div className="space-y-6 page-enter">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Deals</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage your sales pipeline
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center rounded-lg bg-muted p-1">
                        <Button
                            variant={view === 'pipeline' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('pipeline')}
                            className="h-8 gap-2"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Pipeline
                        </Button>
                        <Button
                            variant={view === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('list')}
                            className="h-8 gap-2"
                        >
                            <List className="h-4 w-4" />
                            List
                        </Button>
                    </div>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Deal
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-blue-50">
                                <Briefcase className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{deals?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Deals</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-violet-50">
                                <DollarSign className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-emerald-50">
                                <TrendingUp className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{wonDeals.length}</p>
                                <p className="text-sm text-muted-foreground">Deals Won</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-amber-50">
                                <DollarSign className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(wonValue)}</p>
                                <p className="text-sm text-muted-foreground">Revenue Won</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pipeline View */}
            {view === 'pipeline' && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {stages.map((stage) => {
                        const config = stageConfig[stage];
                        const stageDeals = getDealsByStage(stage);
                        const stageValue = stageDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

                        return (
                            <div key={stage} className="flex-shrink-0 w-80">
                                <Card className={cn("h-full", config.border, 'border-t-4')}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-semibold">
                                                {config.label}
                                            </CardTitle>
                                            <Badge variant="secondary" className="text-xs">
                                                {stageDeals.length}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {formatCurrency(stageValue)}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-3 min-h-[300px]">
                                        {stageDeals.map((deal: any) => (
                                            <Card
                                                key={deal.id}
                                                className="cursor-pointer card-hover bg-card border shadow-sm"
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <h4 className="font-medium text-sm line-clamp-1">
                                                            {deal.title}
                                                        </h4>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <p className="text-lg font-bold text-primary mb-3">
                                                        {formatCurrency(deal.value || 0)}
                                                    </p>

                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarFallback className="text-xs bg-muted">
                                                                    {deal.customer?.firstName?.[0] || deal.lead?.firstName?.[0] || 'D'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="truncate max-w-[100px]">
                                                                {deal.customer?.company || deal.lead?.company || 'No company'}
                                                            </span>
                                                        </div>
                                                        {deal.expectedCloseDate && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(deal.expectedCloseDate).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {stageDeals.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                                <Briefcase className="h-8 w-8 mb-2 opacity-30" />
                                                <p className="text-xs">No deals</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List View */}
            {view === 'list' && (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {deals?.map((deal: any) => {
                                const config = stageConfig[deal.stage] || stageConfig.QUALIFICATION;
                                return (
                                    <div key={deal.id} className="p-4 flex items-center justify-between table-row-hover">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-2 h-12 rounded-full", config.bg)} />
                                            <div>
                                                <p className="font-medium">{deal.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {deal.customer?.company || deal.lead?.company || 'No company'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <Badge variant="outline" className={cn(config.bg, config.color)}>
                                                {config.label}
                                            </Badge>
                                            <p className="font-bold w-32 text-right">
                                                {formatCurrency(deal.value || 0)}
                                            </p>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!deals || deals.length === 0) && (
                                <div className="p-12 text-center">
                                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                    <p className="text-muted-foreground">No deals found</p>
                                    <p className="text-sm text-muted-foreground">Create your first deal to get started</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
