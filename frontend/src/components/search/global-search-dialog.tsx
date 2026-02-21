'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Users, FileText, Building2, Loader2 } from 'lucide-react';
import { getInitials, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SearchResult {
    id: string;
    type: 'lead' | 'customer';
    title: string;
    subtitle?: string;
    company?: string;
    email?: string;
    phone?: string;
    amount?: number;
    status?: string;
    url: string;
}

export function GlobalSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when dialog opens
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    // Search leads
    const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
        queryKey: ['search-leads', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            const response = await apiClient.get(`/leads?search=${encodeURIComponent(searchQuery)}`);
            return response.data?.items ?? [];
        },
        enabled: searchQuery.trim().length > 0,
    });

    // Search customers
    const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ['search-customers', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            const response = await apiClient.get(`/customers?search=${encodeURIComponent(searchQuery)}`);
            return response.data;
        },
        enabled: searchQuery.trim().length > 0,
    });



    const isLoading = isLoadingLeads || isLoadingCustomers;

    const handleResultClick = (result: SearchResult) => {
        router.push(result.url);
        onOpenChange(false);
        setSearchQuery('');
    };

    const getSearchResults = (): SearchResult[] => {
        const results: SearchResult[] = [];

        // Add leads
        leadsData?.forEach((lead: any) => {
            results.push({
                id: lead.id,
                type: 'lead',
                title: `${lead.firstName} ${lead.lastName}`,
                subtitle: lead.email,
                company: lead.company,
                status: lead.status,
                url: `/leads/${lead.id}`,
            });
        });

        // Add customers
        customersData?.forEach((customer: any) => {
            results.push({
                id: customer.id,
                type: 'customer',
                title: `${customer.firstName} ${customer.lastName}`,
                subtitle: customer.email,
                company: customer.company,
                url: `/customers/${customer.id}`,
            });
        });



        return results;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'lead':
                return <Users className="h-4 w-4 text-blue-500" />;
            case 'customer':
                return <Building2 className="h-4 w-4 text-emerald-500" />;
            default:
                return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'lead':
                return 'Lead';
            case 'customer':
                return 'Customer';
            default:
                return 'Unknown';
        }
    };

    const getStatusColor = (type: string, status?: string) => {
        if (!status) return 'bg-gray-100 text-gray-800';

        switch (type) {
            case 'lead':
                return 'bg-blue-100 text-blue-800';
            case 'customer':
                return 'bg-emerald-100 text-emerald-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const searchResults = getSearchResults();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 max-w-2xl overflow-hidden">
                <div className="flex flex-col max-h-[600px]">
                    {/* Search Input */}
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                type="search"
                                placeholder="Search leads, customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 h-12 border-0 text-base focus-visible:ring-0"
                            />
                            {isLoading && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    {/* Search Results */}
                    <div className="flex-1 overflow-y-auto">
                        {searchQuery.trim().length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">Start typing to search</p>
                                <p className="text-sm">Search for leads and customers</p>
                            </div>
                        ) : isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                                <p>Searching...</p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">No results found</p>
                                <p className="text-sm">Try searching with different keywords</p>
                            </div>
                        ) : (
                            <div className="p-2">
                                {searchResults.map((result) => (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <div className="flex-shrink-0">
                                            {result.type === 'customer' ? (
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                        {getInitials(result.title)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                    {getTypeIcon(result.type)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium truncate">{result.title}</p>
                                                <Badge variant="secondary" className="text-xs">
                                                    {getTypeLabel(result.type)}
                                                </Badge>
                                                {result.status && (
                                                    <Badge variant="outline" className={cn('text-xs', getStatusColor(result.type, result.status))}>
                                                        {result.status}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {result.subtitle && (
                                                    <span className="truncate">{result.subtitle}</span>
                                                )}
                                                {result.company && (
                                                    <span className="truncate">{result.company}</span>
                                                )}
                                                {result.amount && (
                                                    <span className="font-medium">{formatCurrency(result.amount)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t bg-muted/30">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                                <span>↑↓ Navigate</span>
                                <span>↵ Open</span>
                                <span>ESC Close</span>
                            </div>
                            {searchResults.length > 0 && (
                                <span>{searchResults.length} results</span>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
