'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Download,
    ExternalLink,
    Calendar,
    MapPin,
    Building2,
    Package,
    Clock,
    FileText,
    Tag,
    Layers,
    Hash,
    Globe,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ScrapedTender {
    id: string;
    bidNo: string;
    title: string;
    description: string | null;
    category: string | null;
    state: string | null;
    city: string | null;
    address?: string | null;
    location: string | null;
    department: string | null;
    items: number | null;
    quantity: string | null;
    startDate: string | null;
    endDate: string | null;
    status: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
    source: string;
    sourceUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function TenderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { toast } = useToast();

    const { data: tender, isLoading } = useQuery<ScrapedTender>({
        queryKey: ['scraped-tender', id],
        queryFn: async () => {
            const res = await apiClient.get(`/scraped-tenders/${id}`);
            return res.data;
        },
    });

    const handleDownloadPdf = async () => {
        if (!tender) return;
        try {
            const res = await apiClient.get(`/scraped-tenders/${id}/pdf`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tender-${tender.bidNo.replace(/\//g, '-')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to download PDF:', error);
            toast({ title: 'Failed to download PDF', variant: 'destructive' });
        }
    };

    const handleViewOnGem = async () => {
        if (!tender) return;
        try {
            const res = await apiClient.get(`/scraped-tenders/${id}/gem-document`, {
                responseType: 'blob',
            });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GeM-Bidding-${tender.bidNo.replace(/[/\\:*?"<>|]+/g, '-')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'This tender document is not available on GeM portal.';
            toast({ title: 'GeM Document Unavailable', description: msg, variant: 'destructive' });
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return {
                    label: 'Active',
                    icon: CheckCircle2,
                    bgClass: 'bg-gradient-to-r from-emerald-500 to-green-500',
                    textClass: 'text-white',
                    badgeClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                };
            case 'EXPIRED':
                return {
                    label: 'Expired',
                    icon: AlertCircle,
                    bgClass: 'bg-gradient-to-r from-red-500 to-rose-500',
                    textClass: 'text-white',
                    badgeClass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
                };
            case 'CLOSED':
                return {
                    label: 'Closed',
                    icon: XCircle,
                    bgClass: 'bg-gradient-to-r from-slate-500 to-gray-500',
                    textClass: 'text-white',
                    badgeClass: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800',
                };
            default:
                return {
                    label: status,
                    icon: Tag,
                    bgClass: 'bg-gray-500',
                    textClass: 'text-white',
                    badgeClass: 'bg-gray-100 text-gray-700',
                };
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Not specified';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDaysRemaining = () => {
        if (!tender?.endDate) return null;
        const end = new Date(tender.endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-64 lg:col-span-2 rounded-xl" />
                        <Skeleton className="h-64 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!tender) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
                <Card className="max-w-md mx-auto border-0 shadow-xl">
                    <CardContent className="pt-6 text-center">
                        <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tender Not Found</h3>
                        <p className="text-muted-foreground text-sm mt-1">The tender you're looking for doesn't exist</p>
                        <Button onClick={() => router.back()} className="mt-6">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusConfig = getStatusConfig(tender.status);
    const StatusIcon = statusConfig.icon;
    const daysRemaining = getDaysRemaining();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="max-w-7xl mx-auto space-y-6 page-enter px-4 sm:px-6 lg:px-8 pt-6 pb-10">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-black/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.back()}
                            className="mb-4 text-white/80 hover:text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Tenders
                        </Button>
                        
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-white/20">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <h1 className="text-2xl font-bold">{tender.bidNo}</h1>
                                    <Badge className={cn("font-medium border", statusConfig.badgeClass)}>
                                        <StatusIcon className="h-3.5 w-3.5 mr-1" />
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                                <p className="text-white/80 text-sm line-clamp-2">{tender.title || 'No title specified'}</p>
                                <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Globe className="h-4 w-4" />
                                        {tender.source}
                                    </span>
                                    {tender.category && (
                                        <span className="flex items-center gap-1">
                                            <Tag className="h-4 w-4" />
                                            {tender.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-2 shrink-0">
                                <Button 
                                    onClick={handleDownloadPdf} 
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </Button>
                                {tender.sourceUrl && (
                                    <Button 
                                        onClick={handleViewOnGem}
                                        className="bg-white text-indigo-600 hover:bg-white/90"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        View on GeM
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(tender.startDate)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                    <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">End Date</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(tender.endDate)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tender.items || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className={cn("h-1.5", 
                            daysRemaining !== null && daysRemaining > 7 ? "bg-gradient-to-r from-emerald-500 to-green-500" :
                            daysRemaining !== null && daysRemaining > 3 ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                            "bg-gradient-to-r from-red-500 to-rose-500"
                        )} />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg",
                                    daysRemaining !== null && daysRemaining > 7 ? "bg-emerald-100 dark:bg-emerald-900/30" :
                                    daysRemaining !== null && daysRemaining > 3 ? "bg-amber-100 dark:bg-amber-900/30" :
                                    "bg-red-100 dark:bg-red-900/30"
                                )}>
                                    <Sparkles className={cn("h-5 w-5",
                                        daysRemaining !== null && daysRemaining > 7 ? "text-emerald-600 dark:text-emerald-400" :
                                        daysRemaining !== null && daysRemaining > 3 ? "text-amber-600 dark:text-amber-400" :
                                        "text-red-600 dark:text-red-400"
                                    )} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Days Left</p>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {daysRemaining !== null ? `${daysRemaining} days` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tender Details */}
                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    Tender Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Title</h3>
                                    <p className="text-slate-900 dark:text-slate-100 font-medium">{tender.title || 'Not specified'}</p>
                                </div>
                                
                                {tender.description && (
                                    <div>
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</h3>
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{tender.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {tender.category && (
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Tag className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase">Category</span>
                                            </div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{tender.category}</p>
                                        </div>
                                    )}
                                    
                                    {tender.quantity && (
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Hash className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase">Quantity</span>
                                            </div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{tender.quantity}</p>
                                        </div>
                                    )}
                                    
                                    {tender.items !== null && (
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Layers className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground uppercase">Items</span>
                                            </div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{tender.items}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Department & Location */}
                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                        <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    Department & Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid gap-4">
                                    {tender.department && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                                <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</p>
                                                <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">{tender.department}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {tender.state && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                                                <MapPin className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">State</p>
                                                <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">{tender.state}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {tender.city && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                                <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">City</p>
                                                <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">{tender.city}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {tender.address && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</p>
                                                <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">{tender.address}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {tender.location && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</p>
                                                <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">{tender.location}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!tender.department && !tender.state && !tender.city && !tender.address && !tender.location && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <MapPin className="h-12 w-12 mx-auto opacity-30 mb-2" />
                                            <p>No location information available</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-white/20">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold text-lg">Quick Actions</h3>
                                </div>
                                <p className="text-white/80 text-sm mb-4">
                                    Download the tender document or view it directly on the GeM portal.
                                </p>
                                <div className="space-y-2">
                                    <Button 
                                        onClick={handleDownloadPdf}
                                        className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </Button>
                                    {tender.sourceUrl && (
                                        <Button 
                                            onClick={handleViewOnGem}
                                            className="w-full bg-white text-indigo-600 hover:bg-white/90"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View on GeM Portal
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                                        <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bidding Starts</p>
                                            <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">{formatDate(tender.startDate)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                                            <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bidding Ends</p>
                                            <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">{formatDate(tender.endDate)}</p>
                                        </div>
                                    </div>
                                    
                                    {daysRemaining !== null && (
                                        <div className={cn("mt-4 p-3 rounded-lg",
                                            daysRemaining > 7 ? "bg-emerald-50 dark:bg-emerald-900/20" :
                                            daysRemaining > 3 ? "bg-amber-50 dark:bg-amber-900/20" :
                                            "bg-red-50 dark:bg-red-900/20"
                                        )}>
                                            <p className={cn("text-sm font-medium",
                                                daysRemaining > 7 ? "text-emerald-700 dark:text-emerald-400" :
                                                daysRemaining > 3 ? "text-amber-700 dark:text-amber-400" :
                                                "text-red-700 dark:text-red-400"
                                            )}>
                                                {daysRemaining > 0 
                                                    ? `${daysRemaining} days remaining to bid`
                                                    : daysRemaining === 0 
                                                        ? "Last day to bid!"
                                                        : "Bidding has ended"
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                        <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    Metadata
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Source</span>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">{tender.source}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge variant="outline" className={statusConfig.badgeClass}>
                                            {statusConfig.label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created</span>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(tender.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last Updated</span>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(tender.updatedAt)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
