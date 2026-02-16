'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Settings, User, LogOut, Moon, Sun, Loader2, Users, Building2 } from 'lucide-react';
import { getInitials, formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/notification-center';
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

export function Header() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Search leads
    const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
        queryKey: ['search-leads', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];
            const response = await apiClient.get(`/leads?search=${encodeURIComponent(searchQuery)}`);
            return response.data;
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

    const handleResultClick = (result: SearchResult) => {
        window.location.href = result.url;
        setSearchQuery('');
        setSearchOpen(false);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'lead':
                return <Users className="h-3 w-3 text-blue-500" />;
            case 'customer':
                return <Building2 className="h-3 w-3 text-emerald-500" />;
            default:
                return null;
        }
    };

    const searchResults = getSearchResults();

    return (
        <header className="sticky top-0 z-40 h-16 border-b bg-card/80 backdrop-blur-xl">
            <div className="flex h-full items-center justify-between px-6">
                {/* Left side - Search */}
                <div className="flex items-center gap-4">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            type="search"
                            placeholder="Search leads, customers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchOpen(true)}
                            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                            className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1"
                        />
                        {isLoading && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}

                        {/* Search Results Dropdown */}
                        {searchOpen && searchQuery.trim().length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                                {isLoading ? (
                                    <div className="p-4 text-center text-muted-foreground">
                                        <Loader2 className="h-4 w-4 mx-auto mb-2 animate-spin" />
                                        <p className="text-sm">Searching...</p>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground">
                                        <p className="text-sm">No results found</p>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        {searchResults.slice(0, 8).map((result) => (
                                            <div
                                                key={`${result.type}-${result.id}`}
                                                className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                                                onClick={() => handleResultClick(result)}
                                            >
                                                <div className="flex-shrink-0">
                                                    {getTypeIcon(result.type)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-sm truncate">{result.title}</p>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {result.type}
                                                        </Badge>
                                                        {result.status && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {result.status}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                                        {searchResults.length > 8 && (
                                            <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                                                {searchResults.length - 8} more results...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <NotificationCenter />

                    {/* Settings */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => router.push('/settings')}
                    >
                        <Settings className="h-5 w-5" />
                    </Button>

                    {/* Divider */}
                    <div className="hidden sm:block h-8 w-px bg-border mx-2" />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 gap-2 px-2">
                                <Avatar className="h-8 w-8 border border-border">
                                    <AvatarImage src={user?.avatar} alt={user?.firstName} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                        {user ? getInitials(user.firstName, user.lastName) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium leading-tight">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {user?.role?.toLowerCase().replace('_', ' ')}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
