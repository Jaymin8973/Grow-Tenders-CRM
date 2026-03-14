'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, FileImage, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AddPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId?: string;
    customerId?: string;
}

export function AddPaymentDialog({ open, onOpenChange, leadId, customerId }: AddPaymentDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            // Simple validation could go here
            setScreenshot(file);
        }
    };

    const submitMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('amount', amount);
            formData.append('notes', notes);
            if (leadId) formData.append('leadId', leadId);
            if (customerId) formData.append('customerId', customerId);
            if (screenshot) formData.append('screenshot', screenshot);

            return apiClient.post('/payment-requests', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        onSuccess: () => {
            toast({
                title: 'Payment Request Submitted',
                description: 'Super Admin will review this payment shortly.',
            });
            onOpenChange(false);
            setAmount('');
            setNotes('');
            setScreenshot(null);

            // Invalidate relevant queries
            if (leadId) queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
            if (customerId) queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
            queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Submission Failed',
                description: getErrorMessage(error),
                variant: 'destructive',
            });
        },
    });

    const isFormValid = amount && !isNaN(Number(amount)) && Number(amount) > 0 && screenshot;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Payment details</DialogTitle>
                    <DialogDescription>
                        Submit proof of payment so an Admin can verify and mark this deal as closed.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount Received (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="e.g. 5000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Screenshot/Receipt <span className="text-red-500">*</span></Label>
                        <div
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors overflow-hidden ${screenshot ? 'border-primary/50 bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />

                            {screenshot ? (
                                <div className="flex w-full max-w-full items-center justify-between gap-2 bg-background p-2 rounded-md shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                        <FileImage className="h-5 w-5 text-primary shrink-0" />
                                        <span className="block max-w-56 flex-1 text-sm font-medium truncate">{screenshot.name}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setScreenshot(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4">
                                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">Click to upload proof</p>
                                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, or PDF</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Plan Details & Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="E.g., 6 months state package, paid via UPI..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => submitMutation.mutate()}
                        disabled={!isFormValid || submitMutation.isPending}
                        className="gap-2"
                    >
                        {submitMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        {submitMutation.isPending ? 'Submitting...' : 'Submit Payment Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
