
import { useState } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle } from 'lucide-react';

export function PaymentRequestForm() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [leadId, setLeadId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [leadSearch, setLeadSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');

    const {
        data: leads,
        isLoading: isLoadingLeads,
        fetchNextPage: fetchNextLeadsPage,
        hasNextPage: hasMoreLeads,
        isFetchingNextPage: isLoadingMoreLeads,
    } = useInfiniteQuery({
        queryKey: ['leads', 'options', { search: leadSearch }],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            params.set('page', String(pageParam ?? 1));
            params.set('limit', '50');
            if (leadSearch) params.set('search', leadSearch);
            const response = await apiClient.get(`/leads/options?${params.toString()}`);
            return response.data;
        },
        getNextPageParam: (lastPage: any) => {
            const page = Number(lastPage?.meta?.page ?? 1);
            const totalPages = Number(lastPage?.meta?.totalPages ?? 1);
            if (page < totalPages) return page + 1;
            return undefined;
        },
    });

    const leadOptions = leads?.pages
        ?.flatMap((p: any) => (Array.isArray(p?.data) ? p.data : []))
        .map((lead: any) => ({
            value: lead.id,
            label: `${lead.firstName} ${lead.lastName}`,
        })) || [];

    const {
        data: customers,
        isLoading: isLoadingCustomers,
        fetchNextPage: fetchNextCustomersPage,
        hasNextPage: hasMoreCustomers,
        isFetchingNextPage: isLoadingMoreCustomers,
    } = useInfiniteQuery({
        queryKey: ['customers', 'options', { search: customerSearch }],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            params.set('page', String(pageParam ?? 1));
            params.set('limit', '50');
            if (customerSearch) params.set('search', customerSearch);
            const response = await apiClient.get(`/customers/options?${params.toString()}`);
            return response.data;
        },
        getNextPageParam: (lastPage: any) => {
            const page = Number(lastPage?.meta?.page ?? 1);
            const totalPages = Number(lastPage?.meta?.totalPages ?? 1);
            if (page < totalPages) return page + 1;
            return undefined;
        },
    });

    const customerOptions = customers?.pages
        ?.flatMap((p: any) => (Array.isArray(p?.data) ? p.data : []))
        .map((customer: any) => ({
            value: customer.id,
            label: `${customer.firstName} ${customer.lastName}`,
        })) || [];

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            return apiClient.post('/payment-requests', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        },
        onSuccess: () => {
            toast({ title: 'Payment request submitted successfully' });
            setAmount('');
            setNotes('');
            setLeadId('');
            setCustomerId('');
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ['target-stats'] });
            // If we listed requests somewhere, invalidate that too
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to submit request',
                description: getErrorMessage(error),
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return toast({ title: 'Amount is required', variant: 'destructive' });

        const formData = new FormData();
        formData.append('amount', amount);
        if (notes) formData.append('notes', notes);
        if (leadId && leadId !== 'none') formData.append('leadId', leadId);
        if (customerId && customerId !== 'none') formData.append('customerId', customerId);
        if (file) formData.append('screenshot', file);

        mutation.mutate(formData);
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Submit Payment Request</CardTitle>
                <CardDescription>Upload proof of payment to update your target stats</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lead">Related Lead (Optional)</Label>
                            <InfiniteAutocomplete
                                value={leadId || 'none'}
                                onValueChange={setLeadId}
                                placeholder="Search lead (name/company/phone/email)..."
                                emptyMessage="No leads found"
                                options={[{ value: 'none', label: 'None' }, ...leadOptions]}
                                loading={isLoadingLeads}
                                showAllOption={false}
                                hasMore={!!hasMoreLeads}
                                loadingMore={isLoadingMoreLeads}
                                onLoadMore={() => fetchNextLeadsPage()}
                                searchValue={leadSearch}
                                onSearchChange={setLeadSearch}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customer">Related Customer (Optional)</Label>
                            <InfiniteAutocomplete
                                value={customerId || 'none'}
                                onValueChange={setCustomerId}
                                placeholder="Search customer (name/company/phone/email)..."
                                emptyMessage="No customers found"
                                options={[{ value: 'none', label: 'None' }, ...customerOptions]}
                                loading={isLoadingCustomers}
                                showAllOption={false}
                                hasMore={!!hasMoreCustomers}
                                loadingMore={isLoadingMoreCustomers}
                                onLoadMore={() => fetchNextCustomersPage()}
                                searchValue={customerSearch}
                                onSearchChange={setCustomerSearch}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any details covering this payment..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="screenshot">Payment Screenshot</Label>
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}>
                            <input
                                type="file"
                                id="screenshot"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <label htmlFor="screenshot" className="cursor-pointer w-full h-full block">
                                {file ? (
                                    <div className="flex items-center justify-center gap-2 text-primary font-medium">
                                        <CheckCircle className="h-4 w-4" />
                                        {file.name}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Upload className="h-8 w-8 mb-1" />
                                        <span className="text-sm">Click to upload screenshot</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
