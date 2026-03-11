'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    MapPin,
    Globe,
    Calendar as CalendarIcon,
    User,
    MessageSquare,
    Paperclip,
    Send,
    Plus,
    Flame,
    Thermometer,
    Snowflake,
    Clock,
    CheckCircle2,
    Edit,
    Trash2,
    ChevronRight,
    Tag,
    FileText,
    History,
    MailOpen,
    CalendarDays,
    UserCircle,
    Sparkles,
} from 'lucide-react';
import { ComposeEmailDialog } from '@/components/mail/compose-email-dialog';
import { AssignLeadDialog } from '@/components/leads/assign-lead-dialog';
import { TransferLeadDialog } from '@/components/leads/transfer-lead-dialog';
import { formatDistanceToNow, format } from 'date-fns';
import { getInitials, cn, formatCurrency } from '@/lib/utils';
import { AddPaymentDialog } from '@/components/payment-requests/add-payment-dialog';
import { IndianRupee } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; gradient: string }> = {
    WARM_LEAD: { label: 'Warm Lead', color: 'text-amber-700', bg: 'bg-amber-50', icon: Thermometer, gradient: 'from-amber-500 to-orange-500' },
    HOT_LEAD: { label: 'Hot Lead', color: 'text-rose-700', bg: 'bg-rose-50', icon: Flame, gradient: 'from-rose-500 to-red-500' },
    COLD_LEAD: { label: 'Cold Lead', color: 'text-blue-700', bg: 'bg-blue-50', icon: Snowflake, gradient: 'from-blue-500 to-cyan-500' },
    CLOSED_LEAD: { label: 'Closed Lead', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2, gradient: 'from-emerald-500 to-green-500' },
    PROPOSAL_LEAD: { label: 'Proposal Lead', color: 'text-purple-700', bg: 'bg-purple-50', icon: Sparkles, gradient: 'from-purple-500 to-violet-500' },
};



export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const leadId = params.id as string;

    const [noteContent, setNoteContent] = useState('');
    const [emailOpen, setEmailOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [addPaymentOpen, setAddPaymentOpen] = useState(false);


    const [followUpOpen, setFollowUpOpen] = useState(false);
    const [followUpDate, setFollowUpDate] = useState<Date>();
    const [followUpDescription, setFollowUpDescription] = useState('');
    const [timelineLimit, setTimelineLimit] = useState(10);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch lead details
    const { data: lead, isLoading } = useQuery({
        queryKey: ['lead', leadId],
        queryFn: async () => {
            const response = await apiClient.get(`/leads/${leadId}`);
            return response.data;
        },
    });

    const updateLeadMutation = useMutation({
        mutationFn: async (payload: { status?: string; nextFollowUp?: string | null }) => {
            const res = await apiClient.patch(`/leads/${leadId}`, payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            toast({ title: 'Lead updated' });
        },
        onError: (err: any) => {
            toast({ title: err.response?.data?.message || 'Failed to update lead', variant: 'destructive' });
        },
    });



    // Convert to customer from lead (Managers/Admins)
    const convertToCustomerMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post(`/customers/from-lead/${leadId}`);
            return res.data;
        },
        onSuccess: (customer) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast({ title: 'Lead converted to customer' });
            router.push(`/customers/${customer.id}`);
        },
        onError: (err: any) => {
            toast({ title: err.response?.data?.message || 'Failed to convert lead', variant: 'destructive' });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            const res = await apiClient.patch(`/leads/${leadId}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            toast({ title: 'Lead status updated' });
        },
        onError: (err: any) => {
            toast({ title: err.response?.data?.message || 'Failed to update status', variant: 'destructive' });
        },
    });

    // Fetch notes
    const { data: notes } = useQuery({
        queryKey: ['notes', 'lead', leadId],
        queryFn: async () => {
            const response = await apiClient.get(`/notes/lead/${leadId}`);
            return response.data;
        },
    });

    // Fetch follow-ups for timeline
    const { data: followUps } = useQuery({
        queryKey: ['follow-ups', 'lead', leadId],
        queryFn: async () => {
            const response = await apiClient.get(`/follow-ups/lead/${leadId}`);
            return response.data;
        },
    });

    // Fetch audit logs for lead timeline
    const { data: auditLogs } = useQuery({
        queryKey: ['audit-logs', 'lead', leadId],
        queryFn: async () => {
            const response = await apiClient.get(`/audit-logs/lead/${leadId}`);
            return response.data;
        },
    });

    // Fetch attachments
    const { data: attachments } = useQuery({
        queryKey: ['attachments', 'lead', leadId],
        queryFn: async () => {
            const response = await apiClient.get(`/attachments/lead/${leadId}`);
            return response.data;
        },
    });

    // Fetch email history
    const { data: emailHistory } = useQuery({
        queryKey: ['email-logs', 'lead', leadId],
        queryFn: async () => {
            const response = await apiClient.get(`/email/logs?leadId=${leadId}`);
            return response.data;
        },
    });

    // Add note mutation
    const addNoteMutation = useMutation({
        mutationFn: async (content: string) => {
            return apiClient.post('/notes', { content, leadId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes', 'lead', leadId] });
            setNoteContent('');
            toast({ title: 'Note added successfully' });
        },
    });

    // Send email mutation
    const sendEmailMutation = useMutation({
        mutationFn: async (data: { to: string; subject: string; body: string }) => {
            return apiClient.post('/email/send', { ...data, leadId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-logs', 'lead', leadId] });
            setEmailOpen(false);
            setEmailSubject('');
            setEmailBody('');
            toast({ title: 'Email sent successfully' });
        },
        onError: () => {
            toast({ title: 'Failed to send email', variant: 'destructive' });
        },
    });

    // Upload attachment mutation
    const uploadAttachmentMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('leadId', leadId);

            return apiClient.post('/attachments/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attachments', 'lead', leadId] });
            toast({ title: 'File uploaded successfully' });
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to upload file',
                description: getErrorMessage(error),
                variant: 'destructive'
            });
        },
    });

    // Log Follow-up mutation
    const logFollowUpMutation = useMutation({
        mutationFn: async () => {
            if (!followUpDate || !followUpDescription) return;

            return apiClient.post('/follow-ups', {
                description: followUpDescription,
                scheduledAt: followUpDate.toISOString(),
                leadId,
            });
        },
        onSuccess: () => {
            if (!followUpDate) return;
            queryClient.invalidateQueries({ queryKey: ['follow-ups', 'lead', leadId] });
            updateLeadMutation.mutate({ nextFollowUp: followUpDate.toISOString() });
            queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['leads', 'today-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['leads', 'today-tasks-view'] });
            queryClient.invalidateQueries({ queryKey: ['leads', 'today-tasks-list'] });
            setFollowUpOpen(false);
            setFollowUpDate(undefined);
            setFollowUpDescription('');
            toast({ title: 'Follow-up scheduled successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to schedule follow-up',
                description: getErrorMessage(error),
                variant: 'destructive'
            });
        }
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadAttachmentMutation.mutate(e.target.files[0]);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex h-full flex-col items-center justify-center">
                <p className="text-muted-foreground">Lead not found</p>
                <Button variant="link" onClick={() => router.push('/leads')}>
                    Back to Leads
                </Button>
            </div>
        );
    }

    const status = statusConfig[lead.status] || statusConfig.COLD_LEAD;
    const isClosed = lead.status === 'CLOSED_LEAD';
    const canUpdateStatus = user?.role !== 'EMPLOYEE' || lead.assigneeId === user?.id;

    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="max-w-7xl mx-auto space-y-6 page-enter pb-16 px-4 sm:px-6 lg:px-8 pt-6">
                {/* Header Section with Gradient Background */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4 min-w-0">
                            <Button variant="ghost" size="icon" onClick={() => router.push('/leads')} className="shrink-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="relative">
                                    <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                        <AvatarFallback className={cn('text-xl font-bold', status.bg, status.color)}>
                                            {getInitials(lead.firstName, lead.lastName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={cn('absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-white shadow-md', status.bg)}>
                                        <StatusIcon className={cn('h-3 w-3', status.color)} />
                                    </div>
                                </div>
                                
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-bold truncate text-slate-900 dark:text-slate-100">
                                            {lead.salutation} {lead.firstName} {lead.lastName}
                                        </h1>
                                        <Badge className={cn('px-3 py-1 text-sm font-medium border-0 shadow-sm bg-gradient-to-r', status.gradient, 'text-white')}>
                                            {status.label}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mt-1 text-muted-foreground">
                                        <span className="flex items-center gap-1.5 text-sm">
                                            <Building2 className="h-4 w-4" />
                                            <span className="truncate max-w-[200px]">{lead.company || 'No company'}</span>
                                        </span>
                                        {lead.industry && (
                                            <>
                                                <span className="text-muted-foreground/30">•</span>
                                                <span className="flex items-center gap-1.5 text-sm">
                                                    <Tag className="h-4 w-4" />
                                                    <span className="truncate max-w-[150px]">{lead.industry}</span>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <ComposeEmailDialog
                                isOpen={emailOpen}
                                onClose={() => setEmailOpen(false)}
                                defaultTo={lead.email}
                                relatedTo={{ type: 'Lead', id: lead.id, name: `${lead.firstName} ${lead.lastName}` }}
                            >
                                <Button className="gap-2 bg-white dark:bg-slate-800" variant="outline">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </Button>
                            </ComposeEmailDialog>

                            {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                                <Button
                                    variant="secondary"
                                    className="gap-2 bg-white dark:bg-slate-800"
                                    onClick={() => convertToCustomerMutation.mutate()}
                                    disabled={convertToCustomerMutation.isPending}
                                >
                                    <User className="h-4 w-4" />
                                    Convert to Customer
                                </Button>
                            )}

                            {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                                <Button
                                    variant="default"
                                    className="gap-2 shadow-md"
                                    onClick={() => setAssignDialogOpen(true)}
                                >
                                    <UserCircle className="h-4 w-4" />
                                    Assign
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <AssignLeadDialog
                    open={assignDialogOpen}
                    onOpenChange={setAssignDialogOpen}
                    leadId={leadId}
                    currentAssigneeId={lead.assignee?.id}
                />

                <TransferLeadDialog
                    open={transferDialogOpen}
                    onOpenChange={setTransferDialogOpen}
                    leadId={leadId}
                />

                <AddPaymentDialog
                    open={addPaymentOpen}
                    onOpenChange={setAddPaymentOpen}
                    leadId={leadId}
                />

                <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Lead Info */}
                <div className="space-y-6">
                    {/* Contact Info Card */}
                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-2 bg-gradient-to-r from-primary to-primary/50" />
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                                    <AvatarFallback className={cn('text-lg font-semibold', status.bg, status.color)}>
                                        {getInitials(lead.firstName, lead.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{lead.salutation} {lead.firstName} {lead.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{lead.position || 'No position'}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/30">
                                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline flex-1 truncate">
                                        {lead.email}
                                    </a>
                                </div>
                                {lead.mobile && (
                                    <div className="flex items-center gap-3 text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/30">
                                            <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-muted-foreground text-xs">Mobile</span>
                                        <a href={`tel:${lead.mobile}`} className="hover:underline flex-1 text-right truncate">
                                            {lead.mobile}
                                        </a>
                                    </div>
                                )}
                                {lead.phone && (
                                    <div className="flex items-center gap-3 text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/30">
                                            <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-muted-foreground text-xs">Phone</span>
                                        <a href={`tel:${lead.phone}`} className="hover:underline flex-1 text-right truncate">
                                            {lead.phone}
                                        </a>
                                    </div>
                                )}
                                {lead.company && (
                                    <div className="flex items-center gap-3 text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-900/30">
                                            <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="truncate flex-1">{lead.company}</span>
                                    </div>
                                )}
                                {(lead.city || lead.state) && (
                                    <div className="flex items-center gap-3 text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="p-2 rounded-md bg-rose-50 dark:bg-rose-900/30">
                                            <MapPin className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <span className="truncate flex-1">
                                            {[lead.city, lead.state].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {lead.website && (
                                    <div className="flex items-center gap-3 text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="p-2 rounded-md bg-cyan-50 dark:bg-cyan-900/30">
                                            <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <a href={lead.website} target="_blank" rel="noopener" className="text-primary hover:underline flex-1 truncate">
                                            {lead.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                <a href={`mailto:${lead.email}`} className="inline-flex">
                                    <Button variant="outline" size="sm" className="gap-2 w-full bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </Button>
                                </a>
                                {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                                        onClick={() => setTransferDialogOpen(true)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                        Transfer
                                    </Button>
                                )}
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
                                    onClick={() => setAddPaymentOpen(true)}
                                >
                                    <IndianRupee className="h-4 w-4" />
                                    Payment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lead Status */}
                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className={cn('h-2 bg-gradient-to-r', status.gradient)} />
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className={cn('p-2 rounded-lg', status.bg)}>
                                    <StatusIcon className={cn('h-4 w-4', status.color)} />
                                </div>
                                Lead Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Current Status</Label>
                                <Select
                                    value={lead.status}
                                    onValueChange={(value) => updateLeadMutation.mutate({ status: value })}
                                    disabled={!canUpdateStatus || updateLeadMutation.isPending}
                                >
                                    <SelectTrigger className={cn('border-2', status.bg, 'border-transparent hover:border-primary/20')}>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WARM_LEAD" className="flex items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <Thermometer className="h-4 w-4 text-amber-500" />
                                                Warm Lead
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="HOT_LEAD">
                                            <div className="flex items-center gap-2">
                                                <Flame className="h-4 w-4 text-rose-500" />
                                                Hot Lead
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="COLD_LEAD">
                                            <div className="flex items-center gap-2">
                                                <Snowflake className="h-4 w-4 text-blue-500" />
                                                Cold Lead
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="CLOSED_LEAD">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                Closed Lead
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="PROPOSAL_LEAD">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-purple-500" />
                                                Proposal Lead
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {!canUpdateStatus && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                                    <Clock className="h-3 w-3" />
                                    Only assignees can update status
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Next Follow-up */}
                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                Next Follow-up
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        'p-2 rounded-lg',
                                        lead.nextFollowUp ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'
                                    )}>
                                        <CalendarIcon className={cn(
                                            'h-5 w-5',
                                            lead.nextFollowUp ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                                        )} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {lead.nextFollowUp ? format(new Date(lead.nextFollowUp), 'PPP') : 'Not scheduled'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {lead.nextFollowUp
                                                ? formatDistanceToNow(new Date(lead.nextFollowUp), { addSuffix: true })
                                                : 'Add a follow-up so it appears in daily tasks.'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5"
                                    onClick={() => setFollowUpOpen(true)}
                                    disabled={isClosed}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Schedule
                                </Button>
                            </div>
                            {isClosed && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Follow-ups disabled for closed leads
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Lead Details Card */}
                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-2 bg-gradient-to-r from-slate-400 to-slate-500" />
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                </div>
                                Lead Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Tag className="h-3.5 w-3.5" />
                                    Source
                                </span>
                                <Badge variant="outline" className="font-medium">{lead.source || 'Unknown'}</Badge>
                            </div>

                            {lead.department && (
                                <div className="flex justify-between items-center text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5" />
                                        Department
                                    </span>
                                    <span className="font-medium">{lead.department}</span>
                                </div>
                            )}

                            {lead.gstin && (
                                <div className="flex justify-between items-center text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5" />
                                        GSTIN
                                    </span>
                                    <span className="font-medium font-mono text-xs">{lead.gstin}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <UserCircle className="h-3.5 w-3.5" />
                                    Assigned To
                                </span>
                                <div className="flex items-center gap-2">
                                    {lead.assignee ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                    {getInitials(lead.assignee.firstName, lead.assignee.lastName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">
                                                {lead.assignee.firstName} {lead.assignee.lastName}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground italic">Unassigned</span>
                                    )}
                                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-primary/10"
                                            onClick={() => setAssignDialogOpen(true)}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5" />
                                    Created
                                </span>
                                <span className="font-medium">
                                    {format(new Date(lead.createdAt), 'PPP')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="timeline" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                            <TabsTrigger value="attachments">Attachments</TabsTrigger>
                            <TabsTrigger value="emails">Emails</TabsTrigger>
                        </TabsList>

                        {/* Timeline Tab */}
                        <TabsContent value="timeline">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Activity Timeline</CardTitle>
                                        <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="gap-2">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    Log Follow-up
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Log Next Follow-up</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full justify-start text-left font-normal",
                                                                        !followUpDate && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {followUpDate ? format(followUpDate, "PPP") : <span>Pick a date</span>}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={followUpDate}
                                                                    onSelect={setFollowUpDate}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Description</Label>
                                                        <Textarea
                                                            placeholder="What needs to be done?"
                                                            value={followUpDescription}
                                                            onChange={(e) => setFollowUpDescription(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setFollowUpOpen(false)}>Cancel</Button>
                                                    <Button
                                                        onClick={() => logFollowUpMutation.mutate()}
                                                        disabled={!followUpDate || !followUpDescription || logFollowUpMutation.isPending}
                                                    >
                                                        {logFollowUpMutation.isPending ? 'Saving...' : 'Save Follow-up'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {(() => {
                                            // Combine follow-ups and audit logs into timeline
                                            const allItems = [
                                                ...(followUps?.map((f: any) => ({
                                                    id: f.id,
                                                    type: 'followup',
                                                    date: new Date(f.createdAt || f.scheduledAt),
                                                    data: f,
                                                })) || []),
                                                ...(auditLogs?.filter((log: any) => log.action !== 'VIEW').map((log: any) => ({
                                                    id: log.id,
                                                    type: 'audit',
                                                    date: new Date(log.createdAt),
                                                    data: log,
                                                })) || []),
                                            ].sort((a, b) => b.date.getTime() - a.date.getTime());

                                            const visibleItems = allItems.slice(0, timelineLimit);
                                            const hasMore = allItems.length > timelineLimit;

                                            return (
                                                <>
                                                    {visibleItems.map((item: any) => {
                                                        if (item.type === 'followup') {
                                                            const f = item.data;
                                                            return (
                                                                <div key={item.id} className="flex gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                                                                    <div className={cn(
                                                                        "p-2 rounded-full h-fit",
                                                                        f.status === 'COMPLETED' ? 'bg-emerald-100' : 'bg-blue-100'
                                                                    )}>
                                                                        {f.status === 'COMPLETED' ? (
                                                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                                        ) : (
                                                                            <Clock className="h-4 w-4 text-blue-600" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="font-medium">Follow-up Scheduled</p>
                                                                            <div className="text-right">
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {format(new Date(f.createdAt || f.scheduledAt), 'PP p')}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground/70">
                                                                                    Scheduled for: {format(new Date(f.scheduledAt), 'PPP')}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground">{f.status}</p>
                                                                        {f.description && (
                                                                            <p className="text-sm mt-1">{f.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        } else {
                                                            const log = item.data;
                                                            const actionColors: Record<string, string> = {
                                                                CREATE: 'bg-green-100 text-green-600',
                                                                UPDATE: 'bg-amber-100 text-amber-600',
                                                                DELETE: 'bg-red-100 text-red-600',
                                                            };
                                                            const actionIcons: Record<string, string> = {
                                                                CREATE: '➕',
                                                                UPDATE: '✏️',
                                                                DELETE: '🗑️',
                                                            };
                                                            return (
                                                                <div key={item.id} className="flex gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                                                                    <div className={cn(
                                                                        "p-2 rounded-full h-fit",
                                                                        actionColors[log.action]?.split(' ')[0] || 'bg-slate-100'
                                                                    )}>
                                                                        <span className="text-sm">{actionIcons[log.action] || '📋'}</span>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="font-medium">
                                                                                    {log.action === 'CREATE' ? 'Created' :
                                                                                     log.action === 'UPDATE' ? 'Updated' : 'Deleted'}
                                                                                </p>
                                                                                {log.user && (
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        by {log.user.firstName} {log.user.lastName}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {format(new Date(log.createdAt), 'PP p')}
                                                                            </p>
                                                                        </div>
                                                                        {log.newValues && Object.keys(log.newValues).length > 0 && (
                                                                            <div className="mt-1">
                                                                                <p className="text-sm text-muted-foreground">
                                                                                    Changed: {Object.keys(log.newValues).filter(k => !['id', 'createdAt', 'updatedAt'].includes(k)).join(', ')}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    })}
                                                    {allItems.length === 0 && (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                                            <p>No activity yet</p>
                                                        </div>
                                                    )}
                                                    {hasMore && (
                                                        <div className="pt-2">
                                                            <Button
                                                                variant="outline"
                                                                className="w-full"
                                                                onClick={() => setTimelineLimit(prev => prev + 10)}
                                                            >
                                                                Load More ({allItems.length - timelineLimit} remaining)
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {allItems.length > 0 && (
                                                        <p className="text-xs text-center text-muted-foreground pt-2">
                                                            Showing {visibleItems.length} of {allItems.length} activities
                                                        </p>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notes Tab */}
                        <TabsContent value="notes">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Add Note Form */}
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="Add a note..."
                                            value={noteContent}
                                            onChange={(e) => setNoteContent(e.target.value)}
                                            rows={2}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={() => addNoteMutation.mutate(noteContent)}
                                            disabled={addNoteMutation.isPending || !noteContent.trim()}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Notes List */}
                                    <div className="space-y-3">
                                        {notes?.map((note: any) => (
                                            <div key={note.id} className="p-3 rounded-lg bg-muted">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(note.createdAt), 'PPP')}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                            </div>
                                        ))}
                                        {(!notes || notes.length === 0) && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                                <p>No notes yet</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Attachments Tab */}
                        <TabsContent value="attachments">
                            <Card>
                                <CardHeader className="flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Attachments</CardTitle>
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadAttachmentMutation.isPending}
                                    >
                                        {uploadAttachmentMutation.isPending ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        ) : (
                                            <Paperclip className="h-4 w-4" />
                                        )}
                                        Upload
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {attachments?.map((attachment: any) => (
                                            <div key={attachment.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors">
                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{attachment.originalName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {(attachment.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/attachments/${attachment.id}/download`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="ghost" size="sm">
                                                        Download
                                                    </Button>
                                                </a>
                                            </div>
                                        ))}
                                        {(!attachments || attachments.length === 0) && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Paperclip className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                                <p>No attachments yet</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Emails Tab */}
                        <TabsContent value="emails">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Email History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {emailHistory?.map((email: any) => (
                                            <div key={email.id} className="p-3 rounded-lg border hover:bg-muted transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="font-medium">{email.subject}</p>
                                                    <Badge variant={email.status === 'sent' ? 'default' : 'destructive'}>
                                                        {email.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {email.body.replace(/<[^>]*>/g, '')}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        ))}
                                        {(!emailHistory || emailHistory.length === 0) && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                                <p>No emails sent yet</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    </div>
    );
}
