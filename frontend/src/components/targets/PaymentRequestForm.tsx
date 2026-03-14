
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle } from 'lucide-react';

export function PaymentRequestForm() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [relatedEntity, setRelatedEntity] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [relatedSearch, setRelatedSearch] = useState('');

    const { data: leadsData } = useQuery({
        queryKey: ['leads', 'options', { search: relatedSearch }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', '1');
            params.set('limit', '50');
            if (relatedSearch) params.set('search', relatedSearch);
            const response = await apiClient.get(`/leads/options?${params.toString()}`);
            return response.data;
        },
    });

    const { data: customersData } = useQuery({
        queryKey: ['customers', 'options', { search: relatedSearch }],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', '1');
            params.set('limit', '50');
            if (relatedSearch) params.set('search', relatedSearch);
            const response = await apiClient.get(`/customers/options?${params.toString()}`);
            return response.data;
        },
    });

    const leadOptions = (Array.isArray(leadsData?.data) ? leadsData.data : leadsData?.items || [])
        .map((lead: any) => ({
            value: `lead:${lead.id}`,
            label: `${lead.firstName} ${lead.lastName}`,
            subtitle: 'Lead',
            searchTerms: `${lead.firstName || ''} ${lead.lastName || ''} ${lead.company || ''} ${lead.phone || ''} ${lead.email || ''}`,
        }));

    const customerOptions = (Array.isArray(customersData?.data) ? customersData.data : customersData?.items || [])
        .map((customer: any) => ({
            value: `customer:${customer.id}`,
            label: `${customer.firstName} ${customer.lastName}`,
            subtitle: 'Customer',
            searchTerms: `${customer.firstName || ''} ${customer.lastName || ''} ${customer.company || ''} ${customer.phone || ''} ${customer.email || ''}`,
        }));

    const relatedOptions = [...leadOptions, ...customerOptions];

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
            setRelatedEntity('');
            setRelatedSearch('');
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
        if (relatedEntity) {
            const [type, id] = relatedEntity.split(':');
            if (type === 'lead' && id) formData.append('leadId', id);
            if (type === 'customer' && id) formData.append('customerId', id);
        }
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

                    <div className="space-y-2">
                        <Label htmlFor="related">Related Lead/Customer (Optional)</Label>
                        <Autocomplete
                            value={relatedEntity}
                            onValueChange={setRelatedEntity}
                            placeholder="Search lead/customer (name/company/phone/email)..."
                            emptyMessage="No results found"
                            options={relatedOptions}
                        />
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
