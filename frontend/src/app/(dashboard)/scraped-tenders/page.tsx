'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
    Search,
    FileText,
    Clock,
    AlertTriangle,
    ExternalLink,
    Download,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';

interface ScrapedTender {
    id: string;
    bidNo: string;
    title: string;
    category: string | null;
    state: string | null;
    department: string | null;
    quantity: string | null;
    startDate: string | null;
    endDate: string | null;
    status: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
    source: string;
    sourceUrl: string | null;
    createdAt: string;
}

interface PaginatedResponse {
    data: ScrapedTender[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface Stats {
    total: number;
    active: number;
    expiringSoon: number;
}

export default function ScrapedTendersPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('');
    const [state, setState] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [status, state, category]);

    const { data: response, isLoading, refetch } = useQuery<PaginatedResponse>({
        queryKey: ['scraped-tenders', debouncedSearch, status, state, category, page, limit],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (status && status !== 'all') params.append('status', status);
            if (state && state !== 'all') params.append('state', state);
            if (category && category !== 'all') params.append('category', category);
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            const res = await apiClient.get(`/scraped-tenders?${params}`);
            return res.data;
        },
    });

    const tenders = response?.data || [];
    const meta = response?.meta;

    const { data: stats } = useQuery<Stats>({
        queryKey: ['scraped-tenders-stats'],
        queryFn: async () => {
            const res = await apiClient.get('/scraped-tenders/stats');
            return res.data;
        },
    });

    const { data: states } = useQuery<string[]>({
        queryKey: ['scraped-tenders-states'],
        queryFn: async () => {
            const res = await apiClient.get('/scraped-tenders/states');
            return res.data;
        },
    });

    const { data: categories } = useQuery<string[]>({
        queryKey: ['scraped-tenders-categories'],
        queryFn: async () => {
            const res = await apiClient.get('/scraped-tenders/categories');
            return res.data;
        },
    });

    const handleDownloadPdf = async (id: string, bidNo: string) => {
        try {
            const res = await apiClient.get(`/scraped-tenders/${id}/pdf`, {
                responseType: 'blob',
            });

            const contentDisposition = res.headers?.['content-disposition'] as string | undefined;
            const match = contentDisposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
            const headerFilename = decodeURIComponent((match?.[1] || match?.[2] || '').trim());

            const sanitize = (name: string) => {
                const safe = name
                    .replace(/[\\/:*?"<>|]+/g, '-')
                    .replace(/\s+/g, ' ')
                    .trim();
                return safe.length ? safe : 'tender';
            };

            const fallback = `tender-${sanitize(bidNo).replace(/\//g, '-')}.pdf`;
            const filename = headerFilename ? sanitize(headerFilename) : fallback;

            const url = window.URL.createObjectURL(res.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast({
                title: 'Failed to download PDF',
                description: 'Please try again in a moment.',
                variant: 'destructive',
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'EXPIRED':
                return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
            case 'CLOSED':
                return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const totalPages = meta?.totalPages || 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">GeM Tenders</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Browse and search tenders from Government e Marketplace
                    </p>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Tenders</p>
                            <p className="text-2xl font-bold">{stats?.total || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Clock className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Tenders</p>
                            <p className="text-2xl font-bold">{stats?.active || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Expiring Soon</p>
                            <p className="text-2xl font-bold">{stats?.expiringSoon || 0}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search by Bid No, Title, or Department..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={state} onValueChange={setState}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All States</SelectItem>
                            {states?.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c.length > 30 ? c.substring(0, 30) + '...' : c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
                        <SelectTrigger className="w-full md:w-[120px]">
                            <SelectValue placeholder="Per page" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 / page</SelectItem>
                            <SelectItem value="20">20 / page</SelectItem>
                            <SelectItem value="50">50 / page</SelectItem>
                            <SelectItem value="100">100 / page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bid No</TableHead>
                            <TableHead className="max-w-[300px]">Title</TableHead>
                            <TableHead>State</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                </TableRow>
                            ))
                        ) : tenders?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No tenders found
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenders?.map((tender) => (
                                <TableRow
                                    key={tender.id}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => router.push(`/scraped-tenders/${tender.id}`)}
                                >
                                    <TableCell className="font-medium text-blue-600">
                                        {tender.bidNo}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                        {tender.title || 'N/A'}
                                    </TableCell>
                                    <TableCell>{tender.state || 'N/A'}</TableCell>
                                    <TableCell>{formatDate(tender.endDate)}</TableCell>
                                    <TableCell>{getStatusBadge(tender.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadPdf(tender.id, tender.bidNo);
                                                }}
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            {tender.sourceUrl && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(tender.sourceUrl!, '_blank');
                                                    }}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {meta && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <div className="text-sm text-gray-500">
                            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, meta.total)} of {meta.total} tenders
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(1)}
                                disabled={page === 1}
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm px-3">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages}
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

