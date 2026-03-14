'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { format } from 'date-fns';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { CreateReportDialog } from '@/components/daily-reports/create-report-dialog';
import { ReportsTable } from '@/components/daily-reports/reports-table';
import { EditReportDialog } from '@/components/daily-reports/edit-report-dialog';
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight, FileText, Users, Clock, TrendingUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatNumber } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface DailyReport {
    id: string;
    title: string | null;
    content: string;
    callCount: number;
    avgTalkTime: number;
    leadsGenerated: number;
    date: string;
    createdAt: string;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
    paymentReceivedFromCustomers: Array<{
        id: string;
        firstName: string;
        lastName: string;
        company?: string;
    }>;
}

interface PaginatedResponse {
    data: DailyReport[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
}

export default function DailyReportsPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const [activeTab, setActiveTab] = useState('today');
    const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Filters
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
    const [employeeSearch, setEmployeeSearch] = useState('');

    const fetchReports = async () => {
        try {
            setLoading(true);
            let query = new URLSearchParams();

            query.append('page', page.toString());
            query.append('limit', limit.toString());

            const dateToUse = activeTab === 'today' ? new Date() : selectedDate;

            if (dateToUse) {
                query.append('date', dateToUse.toISOString());
            }
            if (selectedEmployee && selectedEmployee !== 'all') {
                query.append('employeeId', selectedEmployee);
            }

            const response = await apiClient.get(`/daily-reports?${query.toString()}`);
            const paginatedData: PaginatedResponse = response.data;
            setReports(paginatedData.data);
            setTotal(paginatedData.total);
            setTotalPages(paginatedData.totalPages);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };
    const {
        data: employees,
        isLoading: isLoadingEmployees,
        fetchNextPage: fetchNextEmployeesPage,
        hasNextPage: hasMoreEmployees,
        isFetchingNextPage: isLoadingMoreEmployees,
    } = useInfiniteQuery({
        queryKey: ['users', 'employees', { search: employeeSearch }],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            params.set('role', 'EMPLOYEE');
            params.set('page', String(pageParam ?? 1));
            params.set('limit', '50');
            if (employeeSearch) params.set('search', employeeSearch);
            const response = await apiClient.get(`/users/options?${params.toString()}`);
            return response.data;
        },
        getNextPageParam: (lastPage: any) => {
            const page = Number(lastPage?.meta?.page ?? 1);
            const totalPages = Number(lastPage?.meta?.totalPages ?? 1);
            if (page < totalPages) return page + 1;
            return undefined;
        },
        enabled: !!user && (user.role === 'MANAGER' || user.role === 'SUPER_ADMIN'),
    });

    const employeeOptions =
        employees?.pages
            ?.flatMap((p: any) => (Array.isArray(p?.data) ? p.data : []))
            .map((u: any) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })) || [];

    useEffect(() => {
        if (activeTab === 'today') {
            setSelectedDate(new Date());
            setPage(1);
        } else {
            setSelectedDate(undefined);
            setPage(1);
        }
    }, [activeTab]);

    useEffect(() => {
        setPage(1);
    }, [selectedDate, selectedEmployee]);

    useEffect(() => {
        fetchReports();
    }, [user, selectedDate, selectedEmployee, activeTab, page]);

    const canCreateReport = user?.role === 'EMPLOYEE';
    const canViewAllObject = user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="max-w-7xl mx-auto space-y-6 page-enter px-4 sm:px-6 lg:px-8 pt-6 pb-10">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    Daily Reports
                                </h1>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Track daily performance metrics
                                </p>
                            </div>
                        </div>
                        {canCreateReport && (
                            <CreateReportDialog onSuccess={fetchReports} />
                        )}
                    </div>
                </div>

                {/* Stats Summary */}
                {canViewAllObject && (
                    <TooltipProvider>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Reports</p>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 cursor-default">{formatNumber(total)}</p>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{total.toLocaleString('en-IN')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-500" />
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Page</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{page} / {totalPages}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                        <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employees</p>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 cursor-default">{formatNumber(employeeOptions.length)}</p>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{employeeOptions.length.toLocaleString('en-IN')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                                        <Clock className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">View Mode</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 capitalize">{activeTab}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    </TooltipProvider>
                )}

                {/* Filters for Admin/Manager */}
                {canViewAllObject && (
                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <Tabs defaultValue="today" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="grid w-full max-w-md grid-cols-2">
                                        <TabsTrigger value="today" className="gap-2">
                                         <Clock className="h-4 w-4" />
                                            Today's Reports
                                        </TabsTrigger>
                                        <TabsTrigger value="all" className="gap-2">
                                            <FileText className="h-4 w-4" />
                                            All Reports
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="w-[260px]">
                                        <InfiniteAutocomplete
                                            value={selectedEmployee}
                                            onValueChange={setSelectedEmployee}
                                            placeholder="Filter employee"
                                            emptyMessage="No employees found"
                                            options={employeeOptions}
                                            loading={isLoadingEmployees}
                                            showAllOption={true}
                                            allOptionLabel="All Employees"
                                            allValue="all"
                                            hasMore={!!hasMoreEmployees}
                                            loadingMore={isLoadingMoreEmployees}
                                            onLoadMore={() => fetchNextEmployeesPage()}
                                            searchValue={employeeSearch}
                                            onSearchChange={setEmployeeSearch}
                                        />
                                    </div>

                                    {activeTab === 'all' && (
                                        <>
                                            <div className="w-[240px]">
                                                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start text-left font-normal bg-white dark:bg-slate-800",
                                                                !selectedDate && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={selectedDate}
                                                            onSelect={(date) => {
                                                                setSelectedDate(date);
                                                                setDatePopoverOpen(false);
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            {selectedDate && (
                                                <Button variant="ghost" onClick={() => setSelectedDate(undefined)}>
                                                    Clear Date
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    {activeTab === 'today' && (
                                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                            {format(new Date(), "PPP")}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Reports Table */}
                <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <FileText className="h-16 w-16 opacity-30 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No reports found</h3>
                                <p className="text-sm mt-1">No reports match your current filters</p>
                            </div>
                        ) : (
                            <ReportsTable reports={reports} currentUserId={user?.id} userRole={user?.role} onRefresh={fetchReports} onEdit={(report) => {
                                    setEditingReport(report);
                                    setEditDialogOpen(true);
                                }} />
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing page {page} of {totalPages} ({total} total reports)
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevPage}
                                disabled={page === 1}
                                className="gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setPage(pageNum)}
                                            className="w-9"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={page === totalPages}
                                className="gap-1"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <EditReportDialog
                report={editingReport}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={fetchReports}
            />
        </div>
    );
}
