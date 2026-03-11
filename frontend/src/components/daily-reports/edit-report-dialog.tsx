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

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
    status: string;
}

interface DailyReport {
    id: string;
    title: string | null;
    content: string;
    callCount: number;
    avgTalkTime: number;
    leadsGenerated: number;
    date: string;
    leadIds?: string[];
    leads?: Lead[];
    paymentDetails?: Array<{
        customerId?: string;
        leadId?: string;
        amount?: number;
        notes?: string;
    }>;
}

interface EditReportDialogProps {
    report: DailyReport | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditReportDialog({ report, open, onOpenChange, onSuccess }: EditReportDialogProps) {
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
        if (open && report) {
            form.reset({
                title: report.title || '',
                content: report.content || '',
                callCount: report.callCount || 0,
                avgTalkTime: report.avgTalkTime || 0,
                leadsGenerated: report.leadsGenerated || 0,
                paymentReceivedFromCustomerIds: [],
                leadIds: report.leadIds || [],
                paymentDetails: report.paymentDetails || [],
            });
            fetchLeads();
        }
    }, [open, report]);

    const fetchLeads = async () => {
        try {
            const response = await apiClient.get('/leads?limit=100');
            const data = response.data;
            setLeads(Array.isArray(data) ? data : data?.items || []);
        } catch (error) {
            console.error('Failed to fetch leads', error);
        }
    };

    const paymentDetails = form.watch('paymentDetails') || [];

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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!report) return;
        try {
            await apiClient.put(`/daily-reports/${report.id}`, values);
            toast({
                title: 'Report updated',
                description: 'Your daily report has been updated successfully.',
            });
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to update report. Please try again.';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
        }
    }

    if (!report) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Daily Report</DialogTitle>
                    <DialogDescription>
                        Update your daily work summary.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            value={detail.leadId || ''}
                                            onChange={(e) => updatePaymentDetail(index, 'leadId', e.target.value || undefined)}
                                        >
                                            <option value="">Select Lead</option>
                                            {leads.map(l => (
                                                <option key={l.id} value={l.id}>{l.firstName} {l.lastName} {l.company ? `(${l.company})` : ''}</option>
                                            ))}
                                        </select>
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
                                {form.formState.isSubmitting ? 'Updating...' : 'Update Report'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
