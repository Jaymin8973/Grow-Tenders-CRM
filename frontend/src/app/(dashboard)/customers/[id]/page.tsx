'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
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
    MessageSquare,
    Paperclip,
    Send,
    Plus,
    Clock,
    CheckCircle2,
    DollarSign,
    FileText,

    Bell,
    Save,
    X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getInitials, cn, formatCurrency } from '@/lib/utils';
import { ComposeEmailDialog } from '@/components/mail/compose-email-dialog';

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const customerId = params.id as string;

    const [noteContent, setNoteContent] = useState('');
    const [emailOpen, setEmailOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    // Subscription state
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [subscriptionActive, setSubscriptionActive] = useState(true);

    // Fetch customer details
    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer', customerId],
        queryFn: async () => {
            const response = await apiClient.get(`/customers/${customerId}`);
            return response.data;
        },
    });

    // Fetch notes
    const { data: notes } = useQuery({
        queryKey: ['notes', 'customer', customerId],
        queryFn: async () => {
            const response = await apiClient.get(`/notes/customer/${customerId}`);
            return response.data;
        },
    });



    // Fetch activities
    const { data: activities } = useQuery({
        queryKey: ['activities', 'customer', customerId],
        queryFn: async () => {
            const response = await apiClient.get(`/activities?customerId=${customerId}`);
            return response.data;
        },
    });

    // Fetch invoices
    const { data: invoices } = useQuery({
        queryKey: ['invoices', 'customer', customerId],
        queryFn: async () => {
            const response = await apiClient.get(`/invoices?customerId=${customerId}`);
            return response.data;
        },
    });

    // Fetch email history
    const { data: emailHistory } = useQuery({
        queryKey: ['email-logs', 'customer', customerId],
        queryFn: async () => {
            const response = await apiClient.get(`/email/logs?customerId=${customerId}`);
            return response.data;
        },
    });

    // Fetch subscription
    const { data: subscription, refetch: refetchSubscription } = useQuery({
        queryKey: ['tender-subscription', customerId],
        queryFn: async () => {
            const response = await apiClient.get(`/tenders/subscriptions/${customerId}`);
            return response.data;
        },
    });

    // Fetch available states
    const { data: availableStates } = useQuery({
        queryKey: ['scraped-tenders-states'],
        queryFn: async () => {
            const response = await apiClient.get('/scraped-tenders/states');
            return response.data;
        },
    });

    // Fetch available categories
    const { data: availableCategories } = useQuery({
        queryKey: ['scraped-tenders-categories'],
        queryFn: async () => {
            const response = await apiClient.get('/scraped-tenders/categories');
            return response.data;
        },
    });

    // Initialize subscription state when data loads
    useState(() => {
        if (subscription) {
            setSelectedStates(subscription.states || []);
            setSelectedCategories(subscription.categories || []);
            setSubscriptionActive(subscription.isActive ?? true);
        }
    });

    // Add note mutation
    const addNoteMutation = useMutation({
        mutationFn: async (content: string) => {
            return apiClient.post('/notes', { content, customerId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes', 'customer', customerId] });
            setNoteContent('');
            toast({ title: 'Note added successfully' });
        },
    });

    // Send email mutation
    const sendEmailMutation = useMutation({
        mutationFn: async (data: { to: string; subject: string; body: string }) => {
            return apiClient.post('/email/send', { ...data, customerId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-logs', 'customer', customerId] });
            setEmailOpen(false);
            setEmailSubject('');
            setEmailBody('');
            toast({ title: 'Email sent successfully' });
        },
        onError: () => {
            toast({ title: 'Failed to send email', variant: 'destructive' });
        },
    });

    // Save subscription mutation
    const saveSubscriptionMutation = useMutation({
        mutationFn: async () => {
            return apiClient.post('/tenders/subscriptions', {
                customerId,
                categories: selectedCategories,
                states: selectedStates,
                isActive: subscriptionActive,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tender-subscription', customerId] });
            toast({ title: 'Subscription preferences saved successfully' });
        },
        onError: () => {
            toast({ title: 'Failed to save subscription', variant: 'destructive' });
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex h-full flex-col items-center justify-center">
                <p className="text-muted-foreground">Customer not found</p>
                <Button variant="link" onClick={() => router.push('/customers')}>
                    Back to Customers
                </Button>
            </div>
        );
    }

    const totalRevenue = invoices?.filter((inv: any) => inv.status === 'PAID')
        .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/customers')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">
                            {customer.firstName} {customer.lastName}
                        </h1>
                    </div>
                    <p className="text-muted-foreground">{customer.company || 'No company'}</p>
                </div>
                <ComposeEmailDialog
                    isOpen={emailOpen}
                    onClose={() => setEmailOpen(false)}
                    defaultTo={customer.email}
                    relatedTo={{ type: 'Customer', id: customer.id, name: `${customer.firstName} ${customer.lastName}` }}
                >
                    <Button className="gap-2">
                        <Mail className="h-4 w-4" />
                        Send Email
                    </Button>
                </ComposeEmailDialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-emerald-50">
                                <DollarSign className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-purple-50">
                                <FileText className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{invoices?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Invoices</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-amber-50">
                                <Calendar className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activities?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Activities</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Customer Info */}
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
                                        {getInitials(customer.firstName, customer.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{customer.position || 'No position'}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                                        {customer.email}
                                    </a>
                                </div>
                                {customer.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a href={`tel:${customer.phone}`} className="hover:underline">
                                            {customer.phone}
                                        </a>
                                    </div>
                                )}
                                {customer.company && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <span>{customer.company}</span>
                                    </div>
                                )}
                                {(customer.city || customer.country) && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {[customer.city, customer.state, customer.country].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {customer.website && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <a href={customer.website} target="_blank" rel="noopener" className="text-primary hover:underline">
                                            {customer.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Industry</span>
                                <span className="font-medium">{customer.industry || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Annual Revenue</span>
                                <span className="font-medium">{formatCurrency(customer.annualRevenue || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Assigned To</span>
                                <span className="font-medium">
                                    {customer.assignee ? `${customer.assignee.firstName} ${customer.assignee.lastName}` : 'Unassigned'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Created</span>
                                <span className="font-medium">
                                    {new Date(customer.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="invoices" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="invoices">Invoices</TabsTrigger>
                            <TabsTrigger value="subscription">Tender Subscription</TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                            <TabsTrigger value="emails">Emails</TabsTrigger>
                        </TabsList>

                        {/* Tender Subscription Tab */}
                        <TabsContent value="subscription">
                            <Card>
                                <CardHeader className="flex-row items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">Tender Subscription Preferences</CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Configure automatic email alerts for new tenders matching these criteria.
                                            Emails will be sent every 2 hours.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 mr-4">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={subscriptionActive}
                                                onClick={() => setSubscriptionActive(!subscriptionActive)}
                                                className={cn(
                                                    "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                                                    subscriptionActive ? "bg-primary" : "bg-input"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                                                        subscriptionActive ? "translate-x-5" : "translate-x-0"
                                                    )}
                                                />
                                            </button>
                                            <span className="text-sm font-medium">
                                                {subscriptionActive ? 'Active' : 'Paused'}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() => saveSubscriptionMutation.mutate()}
                                            disabled={saveSubscriptionMutation.isPending}
                                            className="gap-2"
                                        >
                                            <Save className="h-4 w-4" />
                                            {saveSubscriptionMutation.isPending ? 'Saving...' : 'Save Preferences'}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* States Selection */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium">Preferred States</h3>
                                                <Badge variant="outline">{selectedStates.length} selected</Badge>
                                            </div>
                                            <div className="border rounded-lg p-4 h-64 overflow-y-auto space-y-2">
                                                {availableStates?.map((state: string) => (
                                                    <div key={state} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`state-${state}`}
                                                            checked={selectedStates.includes(state)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedStates([...selectedStates, state]);
                                                                } else {
                                                                    setSelectedStates(selectedStates.filter(s => s !== state));
                                                                }
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <label htmlFor={`state-${state}`} className="text-sm cursor-pointer select-none flex-1">
                                                            {state}
                                                        </label>
                                                    </div>
                                                ))}
                                                {(!availableStates || availableStates.length === 0) && (
                                                    <p className="text-sm text-muted-foreground text-center py-8">
                                                        No states available yet
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Select states to receive tender alerts from. Leave empty to receive from all states.
                                            </p>
                                        </div>

                                        {/* Categories Selection */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium">Preferred Categories</h3>
                                                <Badge variant="outline">{selectedCategories.length} selected</Badge>
                                            </div>
                                            <div className="border rounded-lg p-4 h-64 overflow-y-auto space-y-2">
                                                {availableCategories?.map((category: string) => (
                                                    <div key={category} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`category-${category}`}
                                                            checked={selectedCategories.includes(category)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedCategories([...selectedCategories, category]);
                                                                } else {
                                                                    setSelectedCategories(selectedCategories.filter(c => c !== category));
                                                                }
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <label htmlFor={`category-${category}`} className="text-sm cursor-pointer select-none flex-1 truncate" title={category}>
                                                            {category}
                                                        </label>
                                                    </div>
                                                ))}
                                                {(!availableCategories || availableCategories.length === 0) && (
                                                    <p className="text-sm text-muted-foreground text-center py-8">
                                                        No categories available yet
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Select active tender categories. New categories appear here automatically as they are scraped.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Current Selection Summary */}
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                        <h3 className="text-sm font-medium flex items-center gap-2">
                                            <Bell className="h-4 w-4" />
                                            Alert Summary
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            You will receive emails for new tenders matching:
                                            <br />
                                            <strong>States:</strong> {selectedStates.length > 0 ? selectedStates.join(', ') : 'All States'}
                                            <br />
                                            <strong>Categories:</strong> {selectedCategories.length > 0 ? selectedCategories.join(', ') : 'All Categories'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Invoices Tab */}
                        <TabsContent value="invoices">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Invoices</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {invoices?.map((invoice: any) => (
                                            <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
                                                <div>
                                                    <p className="font-medium font-mono">{invoice.invoiceNumber}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(invoice.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'}>
                                                        {invoice.status}
                                                    </Badge>
                                                    <p className="font-bold">{formatCurrency(invoice.total)}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!invoices || invoices.length === 0) && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                                <p>No invoices yet</p>
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
