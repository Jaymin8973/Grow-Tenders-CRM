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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';

interface ScrapedTender {
    id: string;
    bidNo: string;
    title: string;
    description: string | null;
    category: string | null;
    state: string | null;
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
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">Active</Badge>;
            case 'EXPIRED':
                return <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1">Expired</Badge>;
            case 'CLOSED':
                return <Badge className="bg-gray-100 text-gray-800 text-sm px-3 py-1">Closed</Badge>;
            default:
                return <Badge>{status}</Badge>;
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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (!tender) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Tender not found</p>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">{tender.bidNo}</h1>
                            {getStatusBadge(tender.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Source: {tender.source}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleDownloadPdf} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                    {tender.sourceUrl && (
                        <Button onClick={() => window.open(tender.sourceUrl!, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on GeM
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tender Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Title</h3>
                                <p className="mt-1 text-gray-900">{tender.title || 'Not specified'}</p>
                            </div>
                            {tender.description && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                                    <p className="mt-1 text-gray-900">{tender.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                {tender.category && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Category</h3>
                                        <p className="mt-1 text-gray-900">{tender.category}</p>
                                    </div>
                                )}
                                {tender.quantity && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                                        <p className="mt-1 text-gray-900">{tender.quantity}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Department Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Department</h3>
                                    <p className="mt-1 text-gray-900">{tender.department || 'Not specified'}</p>
                                </div>
                            </div>
                            {tender.state && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">State</h3>
                                        <p className="mt-1 text-gray-900">{tender.state}</p>
                                    </div>
                                </div>
                            )}
                            {tender.location && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Location</h3>
                                        <p className="mt-1 text-gray-900">{tender.location}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Dates & Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Important Dates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                                    <p className="mt-1 text-gray-900">{formatDate(tender.startDate)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                                    <p className="mt-1 text-gray-900 font-medium">{formatDate(tender.endDate)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <Package className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                                <h3 className="font-medium text-gray-900">Interested in this tender?</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Download the PDF for your records or view the full details on GeM portal.
                                </p>
                                <Button className="mt-4 w-full" onClick={handleDownloadPdf}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
