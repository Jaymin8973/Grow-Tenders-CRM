'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { Plus } from 'lucide-react';

const formSchema = z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    callCount: z.coerce.number().min(0).optional(),
    avgTalkTime: z.coerce.number().min(0).optional(),
    leadsGenerated: z.coerce.number().min(0).optional(),
    paymentReceivedFromCustomerIds: z.array(z.string()).optional(),
    leadIds: z.array(z.string()).optional(),
    paymentDetails: z.array(z.object({
        customerId: z.string().optional(),
        leadId: z.string().optional(),
        amount: z.coerce.number().min(0).optional(),
        notes: z.string().optional(),
    })).optional(),
});

interface CreateReportDialogProps {
    onSuccess: () => void;
}

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
    status: string;
}

interface PaymentDetail {
    customerId?: string;
    leadId?: string;
    amount?: number;
    notes?: string;
}

export function CreateReportDialog({ onSuccess }: CreateReportDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            content: '',
            callCount: 0,
            avgTalkTime: 0,
            leadsGenerated: 0,
            paymentReceivedFromCustomerIds: [],
            leadIds: [],
            paymentDetails: [],
        },
    });

    useEffect(() => {
        if (open) {
            fetchLeads();
        }
    }, [open]);

    const fetchLeads = async () => {
        try {
            const response = await apiClient.get('/leads?limit=100');
            const data = response.data;
            setLeads(Array.isArray(data) ? data : data?.items || []);
        } catch (error) {
            console.error('Failed to fetch leads', error);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await apiClient.post('/daily-reports', values);
            toast({
                title: 'Report submitted',
                description: 'Your daily report has been submitted successfully.',
            });
            setOpen(false);
            form.reset();
            onSuccess();
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to submit report. Please try again.';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            console.error(error);
        }
    }

    const selectedLeadIds = form.watch('leadIds') || [];
    const paymentDetails = form.watch('paymentDetails') || [];

    const toggleLead = (leadId: string) => {
        const current = form.getValues('leadIds') || [];
        const updated = current.includes(leadId)
            ? current.filter(id => id !== leadId)
            : [...current, leadId];
        form.setValue('leadIds', updated);
    };

    const addPaymentDetail = () => {
        const current = form.getValues('paymentDetails') || [];
        form.setValue('paymentDetails', [...current, { customerId: undefined, leadId: undefined, amount: 0, notes: '' }]);
    };

    const updatePaymentDetail = (index: number, field: string, value: any) => {
        const current = form.getValues('paymentDetails') || [];
        current[index] = { ...current[index], [field]: value };
        form.setValue('paymentDetails', [...current]);
    };

    const removePaymentDetail = (index: number) => {
        const current = form.getValues('paymentDetails') || [];
        current.splice(index, 1);
        form.setValue('paymentDetails', [...current]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Report
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Daily Report</DialogTitle>
                    <DialogDescription>
                        Submit your daily work summary here.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Title field removed */}

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="callCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Call Count</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="avgTalkTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Avg Talk Time (mins)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" step="0.1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="leadsGenerated"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Leads Generated</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Payment Details from Leads */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <FormLabel>Payments From Leads</FormLabel>
                                <Button type="button" variant="outline" size="sm" onClick={addPaymentDetail}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Payment
                                </Button>
                            </div>
                            <FormDescription>
                                Add payment amounts received from leads.
                            </FormDescription>
                            {paymentDetails.map((detail, index) => (
                                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        <SearchableSelect
                                            value={detail.leadId || ''}
                                            onValueChange={(value) => updatePaymentDetail(index, 'leadId', value || undefined)}
                                            placeholder="Select Lead"
                                            emptyMessage="No leads found."
                                            options={leads.map(l => ({
                                                value: l.id,
                                                label: `${l.firstName} ${l.lastName} ${l.company ? `(${l.company})` : ''}`,
                                                searchTerms: `${l.company || ''} ${l.firstName} ${l.lastName}`,
                                            }))}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Amount (₹)"
                                            value={detail.amount || ''}
                                            onChange={(e) => updatePaymentDetail(index, 'amount', parseFloat(e.target.value) || 0)}
                                        />
                                        <Input
                                            placeholder="Notes"
                                            value={detail.notes || ''}
                                            onChange={(e) => updatePaymentDetail(index, 'notes', e.target.value)}
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removePaymentDetail(index)}>
                                        <Plus className="h-4 w-4 rotate-45" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
