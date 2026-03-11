'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

interface EditInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoiceId: string | null;
}

export function EditInvoiceDialog({ open, onOpenChange, invoiceId }: EditInvoiceDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async () => {
            if (!invoiceId) return null;
            const res = await apiClient.get(`/invoices/${invoiceId}`);
            return res.data;
        },
        enabled: open && Boolean(invoiceId),
    });

    const [companyName, setCompanyName] = useState('');
    const [taxRate, setTaxRate] = useState<number>(18);
    const [notes, setNotes] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

    useEffect(() => {
        if (!open) return;
        if (!invoice) {
            setCompanyName('');
            setTaxRate(18);
            setNotes('');
            setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
            return;
        }

        // Prefer lead company, otherwise use stored companyName
        const companyFromLead = invoice.lead?.company || '';
        setCompanyName(companyFromLead || invoice.companyName || '');
        setTaxRate(typeof invoice.taxRate === 'number' ? invoice.taxRate : 18);
        setNotes(invoice.notes || '');
        if (Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0) {
            setLineItems(
                invoice.lineItems.map((li: any) => ({
                    description: li.description || '',
                    quantity: Number(li.quantity || 0),
                    unitPrice: Number(li.unitPrice || 0),
                })),
            );
        } else {
            setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
        }
    }, [open, invoice]);

    const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);

    const removeLineItem = (index: number) => {
        if (lineItems.length <= 1) return;
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };
        setLineItems(updated);
    };

    const subtotal = useMemo(
        () => lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        [lineItems],
    );
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!invoiceId) throw new Error('Missing invoiceId');
            const payload = {
                companyName,
                taxRate,
                notes,
                lineItems: lineItems
                    .filter((li) => li.description.trim() !== '')
                    .map((li) => ({
                        description: li.description,
                        quantity: li.quantity,
                        unitPrice: li.unitPrice,
                    })),
            };
            return apiClient.patch(`/invoices/${invoiceId}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            if (invoiceId) queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
            toast({ title: 'Invoice updated' });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update invoice',
                description: error.response?.data?.message || error.message || 'An error occurred',
                variant: 'destructive',
            });
        },
    });

    const isFormValid =
        lineItems.some((li) => li.description.trim() !== '') &&
        lineItems.every((li) => !li.description.trim() || (li.quantity > 0 && li.unitPrice >= 0));

    const recipientName = invoice?.customer
        ? `${invoice.customer.firstName ?? ''} ${invoice.customer.lastName ?? ''}`.trim()
        : `${invoice?.lead?.firstName ?? ''} ${invoice?.lead?.lastName ?? ''}`.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Invoice</DialogTitle>
                    <DialogDescription>
                        {recipientName ? `Editing invoice for ${recipientName}` : 'Edit invoice details'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                                id="companyName"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Line Items</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addLineItem}
                                    className="gap-1"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Item
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {lineItems.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                                        <div className="col-span-6">
                                            <Input
                                                placeholder="Description"
                                                value={item.description}
                                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                placeholder="Qty"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Input
                                                type="number"
                                                placeholder="Price"
                                                min="0"
                                                value={item.unitPrice || ''}
                                                onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="col-span-1 flex items-center">
                                            {lineItems.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLineItem(index)}
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="taxRate">GST Rate (%)</Label>
                            <Input
                                id="taxRate"
                                type="number"
                                min="0"
                                max="100"
                                value={taxRate}
                                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        <div className="flex justify-end">
                            <div className="text-right space-y-1">
                                <div className="flex justify-between gap-8">
                                    <p className="text-sm text-muted-foreground">Subtotal</p>
                                    <p className="font-medium">{formatCurrency(subtotal)}</p>
                                </div>
                                <div className="flex justify-between gap-8">
                                    <p className="text-sm text-muted-foreground">GST ({taxRate}%)</p>
                                    <p className="font-medium">{formatCurrency(taxAmount)}</p>
                                </div>
                                <div className="flex justify-between gap-8 border-t pt-1">
                                    <p className="text-sm font-semibold">Total</p>
                                    <p className="text-xl font-bold">{formatCurrency(total)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => saveMutation.mutate()}
                        disabled={!isFormValid || saveMutation.isPending || isLoading}
                        className="gap-2"
                    >
                        {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
