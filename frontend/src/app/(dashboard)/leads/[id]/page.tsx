'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    MapPin,
    Globe,
    Calendar,
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
} from 'lucide-react';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { ComposeEmailDialog } from '@/components/mail/compose-email-dialog';
import { AssignLeadDialog } from '@/components/leads/assign-lead-dialog';
import { TransferLeadDialog } from '@/components/leads/transfer-lead-dialog';
import { formatDistanceToNow } from 'date-fns';
import { getInitials, cn, formatCurrency } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    NEW: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-100' },
    CONTACTED: { label: 'Contacted', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    QUALIFIED: { label: 'Qualified', color: 'text-purple-700', bg: 'bg-purple-100' },
    PROPOSAL: { label: 'Proposal', color: 'text-amber-700', bg: 'bg-amber-100' },
    NEGOTIATION: { label: 'Negotiation', color: 'text-orange-700', bg: 'bg-orange-100' },
    WON: { label: 'Won', color: 'text-emerald-700', bg: 'bg-emerald-100' },
    LOST: { label: 'Lost', color: 'text-red-700', bg: 'bg-red-100' },
};

const sourceIcons: Record<string, any> = {
    HOT: { icon: Flame, color: 'text-red-500' },
    WARM: { icon: Thermometer, color: 'text-amber-500' },
    COLD: { icon: Snowflake, color: 'text-blue-500' },
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
    const [createDealOpen, setCreateDealOpen] = useState(false);
    const [dealTitle, setDealTitle] = useState('');
    const [dealValue, setDealValue] = useState('');
    const [expectedCloseDate, setExpectedCloseDate] = useState('');

    // Fetch lead details
    const { data: lead, isLoading } = useQuery({
        queryKey: ['lead', leadId],
        queryFn: async () => {
            const response = await apiClient.get(`/leads/${leadId}`);
            return response.data;
        },
    });

    // Create deal from lead
    const createDealMutation = useMutation({
        mutationFn: async () => {
            const payload: any = {
                title: dealTitle || `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim() || 'New Deal',
                value: Number(dealValue) || 0,
                expectedCloseDate: expectedCloseDate || undefined,
            };
            const res = await apiClient.post(`/deals/from-lead/${leadId}`, payload);
            return res.data;
        },
        onSuccess: (deal) => {
            queryClient.invalidateQueries({ queryKey: ['deals'] });
            setCreateDealOpen(false);
            setDealTitle('');
            setDealValue('');
            setExpectedCloseDate('');
            toast({ title: 'Deal created from lead' });
            router.push(`/deals/${deal.id}`);
        },
        onError: (err: any) => {
            toast({ title: err.response?.data?.message || 'Failed to create deal', variant: 'destructive' });
        }
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

    // Fetch notes
    const { data: notes } = useQuery({
        queryKey: ['notes', 'lead', leadId],
        queryFn: async () => {
            const response = await apiClient.get(`/notes/lead/${leadId}`);
            return response.data;
        },
    });

    // Fetch activities
    const { data: activities } = useQuery({
        queryKey: ['activities', 'lead', leadId],
        queryFn: async () => {
            const response = await apiClient.get(`/activities?leadId=${leadId}`);
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

    const status = statusConfig[lead.status] || statusConfig.NEW;

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/leads')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">
                            {lead.firstName} {lead.lastName}
                        </h1>
                        <Badge className={cn(status.bg, status.color, 'border-0')}>
                            {status.label}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{lead.company || 'No company'}</p>
                </div>
                <ComposeEmailDialog
                    isOpen={emailOpen}
                    onClose={() => setEmailOpen(false)}
                    defaultTo={lead.email}
                    relatedTo={{ type: 'Lead', id: lead.id, name: `${lead.firstName} ${lead.lastName}` }}
                >
                    <Button className="gap-2">
                        <Mail className="h-4 w-4" />
                        Send Email
                    </Button>
                </ComposeEmailDialog>

                <Dialog open={createDealOpen} onOpenChange={setCreateDealOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Deal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Deal from Lead</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm">Title</label>
                                <Input value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} placeholder="Deal title" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm">Value</label>
                                <Input type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder="Amount" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm">Expected Close Date</label>
                                <Input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setCreateDealOpen(false)}>Cancel</Button>
                                <Button onClick={() => createDealMutation.mutate()} disabled={createDealMutation.isPending} className="gap-2">
                                    {createDealMutation.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : null}
                                    Create
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                    <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={() => convertToCustomerMutation.mutate()}
                        disabled={convertToCustomerMutation.isPending}
                    >
                        <User className="h-4 w-4" />
                        Convert to Customer
                    </Button>
                )}

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
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Lead Info */}
                <div className="space-y-6">
                    {/* Contact Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                        {getInitials(lead.firstName, lead.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{lead.position || 'No position'}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                                        {lead.email}
                                    </a>
                                </div>
                                {lead.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a href={`tel:${lead.phone}`} className="hover:underline">
                                            {lead.phone}
                                        </a>
                                    </div>
                                )}
                                {lead.company && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <span>{lead.company}</span>
                                    </div>
                                )}
                                {(lead.city || lead.state) && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {[lead.city, lead.state].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {lead.website && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <a href={lead.website} target="_blank" rel="noopener" className="text-primary hover:underline">
                                            {lead.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lead Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Lead Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Source</span>
                                <span className="font-medium">{lead.source || 'Unknown'}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Assigned To</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : 'Unassigned'}
                                    </span>
                                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => setAssignDialogOpen(true)}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                    )}
                                    {user?.role === 'EMPLOYEE' && lead.assignee?.id === user.id && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-xs text-muted-foreground"
                                            onClick={() => setTransferDialogOpen(true)}
                                        >
                                            Request Transfer
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Created</span>
                                <span className="font-medium">
                                    {new Date(lead.createdAt).toLocaleDateString()}
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
                                        <CreateTaskDialog leadId={leadId} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {activities?.map((activity: any) => (
                                            <div key={activity.id} className="flex gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                                                <div className={cn(
                                                    "p-2 rounded-full h-fit",
                                                    activity.status === 'COMPLETED' ? 'bg-emerald-100' : 'bg-blue-100'
                                                )}>
                                                    {activity.status === 'COMPLETED' ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium">{activity.title}</p>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(activity.scheduledAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{activity.type}</p>
                                                    {activity.description && (
                                                        <p className="text-sm mt-1">{activity.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {(!activities || activities.length === 0) && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                                <p>No activities yet</p>
                                            </div>
                                        )}
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
                                                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
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
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Paperclip className="h-4 w-4" />
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
                                                <Button variant="ghost" size="sm">
                                                    Download
                                                </Button>
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
    );
}
