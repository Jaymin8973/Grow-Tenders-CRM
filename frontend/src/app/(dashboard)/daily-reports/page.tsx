'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DailyReport {
    id: string;
    title: string | null;
    content: string;
    callCount: number;
    avgTalkTime: number;
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

interface User {
    id: string;
    firstName: string;
    lastName: string;
}

export default function DailyReportsPage() {
    const { user } = useAuth();
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('today'); // 'today' or 'all'

    // Filters
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
    const [employees, setEmployees] = useState<User[]>([]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            let query = new URLSearchParams();

            // If active tab is 'today', force date to today
            const dateToUse = activeTab === 'today' ? new Date() : selectedDate;

            if (dateToUse) {
                query.append('date', dateToUse.toISOString());
            }
            if (selectedEmployee && selectedEmployee !== 'all') {
                query.append('employeeId', selectedEmployee);
            }

            const response = await apiClient.get(`/daily-reports?${query.toString()}`);
            setReports(response.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await apiClient.get('/users');
            setEmployees(response.data);
        } catch (error) {
            console.error("Failed to fetch employess", error);
        }
    }

    // Effect to handle tab changes
    useEffect(() => {
        if (activeTab === 'today') {
            setSelectedDate(new Date());
        } else {
            // When switching to 'all', maybe clear the date or keep it? 
            // Let's clear it to show "all" by default, or keep last selection.
            // User requested "All Reports", likely meaning no date filter by default.
            setSelectedDate(undefined);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchReports();
        if (user && (user.role === 'MANAGER' || user.role === 'SUPER_ADMIN')) {
            fetchEmployees();
        }
    }, [user, selectedDate, selectedEmployee, activeTab]); // Added activeTab dependency

    const canCreateReport = user?.role === 'EMPLOYEE';
    const canViewAllObject = user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Daily Reports</h2>
                {canCreateReport && (
                    <CreateReportDialog onSuccess={fetchReports} />
                )}
            </div>

            {/* Filters for Admin/Manager */}
            {canViewAllObject && (
                <div className="space-y-4">
                    <Tabs defaultValue="today" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList>
                            <TabsTrigger value="today">Today's Reports</TabsTrigger>
                            <TabsTrigger value="all">All Reports</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-4 py-4">
                        <div className="w-[200px]">
                            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Picker - Only show in 'All Reports' tab */}
                        {activeTab === 'all' && (
                            <>
                                <div className="w-[240px]">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
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
                                                onSelect={setSelectedDate}
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
                            <div className="text-sm text-muted-foreground">
                                Showing reports for {format(new Date(), "PPP")}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No reports found.</div>
                ) : (
                    <ReportsTable reports={reports} />
                )}
            </div>
        </div>
    );
}
