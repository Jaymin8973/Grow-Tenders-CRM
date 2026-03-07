'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Check,
    ChevronsUpDown,
    Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ScrapedTender {
    id: string;
    bidNo: string;
    title: string;
    category: string | null;
    state: string | null;
    city: string | null;
    department: string | null;
    quantity: string | null;
    startDate: string | null;
    endDate: string | null;
    status: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
    source: string;
    sourceUrl: string | null;
    createdAt: string;
}

interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export default function ScrapedTendersAdvancedSearchPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [keyword, setKeyword] = useState('');
    const [state, setState] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [endDateFrom, setEndDateFrom] = useState('');
    const [endDateTo, setEndDateTo] = useState('');

    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [categoryOpen, setCategoryOpen] = useState(false);

    const [categorySearch, setCategorySearch] = useState('');

    const [resultsPage, setResultsPage] = useState(1);
    const [resultsLimit, setResultsLimit] = useState(20);

    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [debouncedCategorySearch, setDebouncedCategorySearch] = useState('');

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedKeyword(keyword);
            setResultsPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [keyword]);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedCategorySearch(categorySearch);
        }, 400);
        return () => clearTimeout(t);
    }, [categorySearch]);

    useEffect(() => {
        setCity('');
    }, [state]);

    useEffect(() => {
        setResultsPage(1);
    }, [selectedCategory, state, city, endDateFrom, endDateTo]);

    const categoryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('limit', '50');
        if (debouncedCategorySearch) params.append('search', debouncedCategorySearch);
        return params;
    }, [debouncedCategorySearch]);

    const { data: categoriesResp, isLoading: categoriesLoading } = useQuery<PaginatedResponse<string>>({
        queryKey: ['scraped-tenders-adv-categories', debouncedCategorySearch],
        queryFn: async () => {
            const res = await apiClient.get(`/scraped-tenders/categories?${categoryParams.toString()}`);
            return res.data;
        },
    });

    const categories = categoriesResp?.data || [];

    const { data: states, isLoading: statesLoading } = useQuery<string[]>({
        queryKey: ['scraped-tenders-states'],
        queryFn: async () => {
            const res = await apiClient.get('/scraped-tenders/states');
            return res.data;
        },
    });

    const { data: cities, isLoading: citiesLoading } = useQuery<string[]>({
        queryKey: ['scraped-tenders-cities', state],
        queryFn: async () => {
            if (!state || state === 'all') return [];
            const params = new URLSearchParams();
            params.append('state', state);
            const res = await apiClient.get(`/scraped-tenders/cities?${params.toString()}`);
            return res.data;
        },
        enabled: !!state && state !== 'all',
    });

    const resultsParams = useMemo(() => {
        const params = new URLSearchParams();
        params.append('page', resultsPage.toString());
        params.append('limit', resultsLimit.toString());
        if (debouncedKeyword) params.append('search', debouncedKeyword);
        if (selectedCategory) params.append('category', selectedCategory);
        if (state) params.append('state', state);
        if (city) params.append('city', city);
        if (endDateFrom) params.append('endDateFrom', endDateFrom);
        if (endDateTo) params.append('endDateTo', endDateTo);
        return params;
    }, [resultsPage, resultsLimit, debouncedKeyword, selectedCategory, state, city, endDateFrom, endDateTo]);

    const {
        data: resultsResp,
        isLoading: resultsLoading,
        refetch: refetchResults,
    } = useQuery<PaginatedResponse<ScrapedTender>>({
        queryKey: [
            'scraped-tenders-adv-results',
            resultsPage,
            resultsLimit,
            debouncedKeyword,
            selectedCategory,
            state,
            city,
            endDateFrom,
            endDateTo,
        ],
        queryFn: async () => {
            const res = await apiClient.get(`/scraped-tenders?${resultsParams.toString()}`);
            return res.data;
        },
    });

    const tenders = resultsResp?.data || [];
    const resultsMeta = resultsResp?.meta;

    const resetFilters = () => {
        setKeyword('');
        setState('');
        setCity('');
        setEndDateFrom('');
        setEndDateTo('');
        setSelectedCategory('');
        setCategorySearch('');
        setResultsPage(1);
    };
    const totalResultsPages = resultsMeta?.totalPages || 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push('/scraped-tenders')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Advanced Search</h1>
                        <p className="text-sm text-gray-500 mt-1">Search GeM tenders by keyword, category, date, state and city</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            resetFilters();
                            toast({ title: 'Filters reset' });
                        }}
                    >
                        Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => refetchResults()}>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                    </Button>
                </div>
            </div>

            <Card className="p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Use one or more filters to narrow down tenders</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Keyword</Label>
                        <Input
                            placeholder="Search by Bid No, Title, or Department..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={categoryOpen}
                                    className="w-full justify-between font-normal"
                                >
                                    <span className="truncate">
                                        {selectedCategory
                                            ? selectedCategory
                                            : (categoriesLoading ? 'Loading categories...' : 'Select category')}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput
                                        placeholder="Search category..."
                                        value={categorySearch}
                                        onValueChange={setCategorySearch}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            {categoriesLoading ? 'Loading...' : 'No categories found'}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="__all__"
                                                onSelect={() => {
                                                    setSelectedCategory('');
                                                    setCategoryOpen(false);
                                                }}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', !selectedCategory ? 'opacity-100' : 'opacity-0')} />
                                                All Categories
                                            </CommandItem>
                                            {categories.map((c) => (
                                                <CommandItem
                                                    key={c}
                                                    value={c}
                                                    onSelect={() => {
                                                        setSelectedCategory(c);
                                                        setCategoryOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn('mr-2 h-4 w-4', selectedCategory === c ? 'opacity-100' : 'opacity-0')} />
                                                    <span className="truncate">{c}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label>State</Label>
                        <Select value={state} onValueChange={(v) => setState(v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={statesLoading ? 'Loading states...' : 'Select state'} />
                            </SelectTrigger>
                            <SelectContent className="max-h-80 overflow-y-auto">
                                <SelectItem value="all">All States</SelectItem>
                                {(states || []).map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>City</Label>
                        <Select
                            value={city}
                            onValueChange={(v) => setCity(v === 'all' ? '' : v)}
                            disabled={!state}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={!state ? 'Select state first' : (citiesLoading ? 'Loading cities...' : 'Select city')} />
                            </SelectTrigger>
                            <SelectContent className="max-h-80 overflow-y-auto">
                                <SelectItem value="all">All Cities</SelectItem>
                                {(cities || []).map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Bid End Date (From)</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="date"
                                value={endDateFrom}
                                onChange={(e) => setEndDateFrom(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Bid End Date (To)</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="date"
                                value={endDateTo}
                                onChange={(e) => setEndDateTo(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">Tenders</h2>
                    <div className="text-xs text-gray-500">
                        {resultsMeta ? `${resultsMeta.total} results` : ''}
                    </div>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[170px]">Bid No</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="w-[160px]">State</TableHead>
                                    <TableHead className="w-[160px]">City</TableHead>
                                    <TableHead className="w-[140px]">End Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resultsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-sm text-gray-500">
                                            Loading tenders...
                                        </TableCell>
                                    </TableRow>
                                ) : tenders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-sm text-gray-500">
                                            No tenders found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tenders.map((t) => (
                                        <TableRow
                                            key={t.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => router.push(`/scraped-tenders/${t.id}`)}
                                        >
                                            <TableCell className="font-medium text-blue-600 whitespace-nowrap">{t.bidNo}</TableCell>
                                            <TableCell className="max-w-[560px]">
                                                <div className="truncate" title={t.title || ''}>{t.title || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{t.state || 'N/A'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{t.city || 'N/A'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{formatDate(t.endDate)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {resultsMeta && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500">
                                    Showing {((resultsMeta.page - 1) * resultsMeta.limit) + 1} to {Math.min(resultsMeta.page * resultsMeta.limit, resultsMeta.total)} of {resultsMeta.total}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Page {resultsMeta.page} of {resultsMeta.totalPages}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={resultsLimit.toString()} onValueChange={(v) => { setResultsLimit(parseInt(v, 10)); setResultsPage(1); }}>
                                    <SelectTrigger className="w-[140px] h-9">
                                        <SelectValue placeholder="Per page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">20 / page</SelectItem>
                                        <SelectItem value="50">50 / page</SelectItem>
                                        <SelectItem value="100">100 / page</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResultsPage(1)}
                                    disabled={resultsPage === 1}
                                >
                                    <ChevronsLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResultsPage((p) => Math.max(1, p - 1))}
                                    disabled={resultsPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResultsPage((p) => Math.min(totalResultsPages, p + 1))}
                                    disabled={resultsPage >= totalResultsPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResultsPage(totalResultsPages)}
                                    disabled={resultsPage >= totalResultsPages}
                                >
                                    <ChevronsRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
