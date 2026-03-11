'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';
import { getInitials, formatCurrency, formatNumber, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Phone, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function SubmitEodReportDialog() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState('');

    const { data: metrics, isLoading: isMetricsLoading } = useQuery({
        queryKey: ['daily-report-metrics', 'today'],
        queryFn: async () => {
            const response = await apiClient.get('/daily-reports/metrics/today');
            return response.data;
        },
        enabled: open, // Only fetch when dialog opens
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
            return apiClient.post('/daily-reports', {
                title: `EOD Report - ${new Date().toLocaleDateString()}`,
                content: notes,
                callCount: metrics?.callCount || 0,
                leadsGenerated: metrics?.leadsGenerated || 0,
            });
        },
        onSuccess: () => {
            toast({
                title: 'Report Submitted',
                description: 'Your End of Day report has been successfully submitted.',
            });
            setOpen(false);
            setNotes('');
            queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to submit report',
                description: getErrorMessage(error),
                variant: 'destructive',
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Send className="h-4 w-4" />
                    Submit EOD Report
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Submit End of Day Report</DialogTitle>
                    <DialogDescription>
                        Review your auto-calculated metrics for today and add any final notes before submitting.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {isMetricsLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-slate-50 border-dashed">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <Phone className="h-6 w-6 text-primary mb-2 opacity-80" />
                                    <p className="text-2xl font-bold">{formatNumber(metrics?.callCount || 0)}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Calls Made</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-50 border-dashed">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <UserPlus className="h-6 w-6 text-emerald-500 mb-2 opacity-80" />
                                    <p className="text-2xl font-bold">{formatNumber(metrics?.leadsGenerated || 0)}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Leads Won</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="space-y-2 mt-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Any blockers, wins, or info for your manager?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => submitMutation.mutate()}
                        disabled={submitMutation.isPending || isMetricsLoading}
                    >
                        {submitMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Report'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
