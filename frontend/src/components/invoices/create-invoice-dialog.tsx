'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Autocomplete } from '@/components/ui/autocomplete';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

interface CreateInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoiceType: 'PERFORMA' | 'REGULAR';
}

export function CreateInvoiceDialog({
    open,
    onOpenChange,
    invoiceType,
}: CreateInvoiceDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [selectedLeadId, setSelectedLeadId] = useState<string>('');
    const [companyName, setCompanyName] = useState('');
    const [taxRate, setTaxRate] = useState<number>(18); // Default 18% GST
    const [notes, setNotes] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: '', quantity: 1, unitPrice: 0 },
    ]);

    // Fetch leads based on invoice type
    const leadStatus = invoiceType === 'PERFORMA' ? 'PROPOSAL_LEAD' : 'HOT_LEAD';
    
    const { data: leadsData, isLoading: leadsLoading } = useQuery({
        queryKey: ['leads-for-invoice', leadStatus],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('status', leadStatus);
            params.append('pageSize', '100');
            const response = await apiClient.get(`/leads?${params.toString()}`);
            return response.data;
        },
        enabled: open,
    });

    const leads = leadsData?.items ?? [];

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedLeadId('');
            setCompanyName('');
            setTaxRate(18);
            setNotes('');
            setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
        }
    }, [open]);

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        }
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };
        setLineItems(updated);
    };

    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const submitMutation = useMutation({
        mutationFn: async () => {
            const response = await apiClient.post('/invoices', {
                companyName: companyName || 'Unknown Company',
                leadId: selectedLeadId,
                invoiceType,
                taxRate,
                notes,
                lineItems: lineItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
            });
            return response.data;
        },
        onSuccess: (invoice) => {
            toast({
                title: `${invoiceType === 'PERFORMA' ? 'Performa' : 'Invoice'} Created`,
                description: `Invoice ${invoice.invoiceNumber} has been created successfully.`,
            });
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to create invoice',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive',
            });
        },
    });

    const isFormValid = selectedLeadId && lineItems.every(item => item.description && item.quantity > 0 && item.unitPrice > 0);

    const handleSubmit = () => {
        // Validate form with specific error messages
        if (!selectedLeadId) {
            toast({ 
                title: 'Validation Error', 
                description: 'Please select a lead',
                variant: 'destructive' 
            });
            return;
        }

        const invalidItems = lineItems.filter(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0);
        if (invalidItems.length > 0) {
            toast({ 
                title: 'Validation Error', 
                description: 'All line items must have description, quantity, and price',
                variant: 'destructive' 
            });
            return;
        }

        submitMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Create {invoiceType === 'PERFORMA' ? 'Performa' : 'Regular'} Invoice
                    </DialogTitle>
                    <DialogDescription>
                        {invoiceType === 'PERFORMA' 
                            ? 'Create a proforma invoice for a Proposal Lead' 
                            : 'Create an invoice for a Hot Lead'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="lead">Select Lead <span className="text-red-500">*</span></Label>
                        {leadsLoading ? (
                            <div className="flex items-center gap-2 p-2 border rounded-md">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Loading leads...</span>
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="p-2 border rounded-md text-sm text-muted-foreground">
                                No {invoiceType === 'PERFORMA' ? 'Proposal' : 'Hot'} leads available
                            </div>
                        ) : (
                            <Autocomplete
                                value={selectedLeadId}
                                onValueChange={(leadId) => {
                                    setSelectedLeadId(leadId);
                                    // Auto-fill company name from selected lead
                                    const selectedLead = leads.find((l: any) => l.id === leadId);
                                    setCompanyName(selectedLead?.company || '');
                                }}
                                placeholder={`Search ${invoiceType === 'PERFORMA' ? 'Proposal' : 'Hot'} lead...`}
                                emptyMessage="No leads found"
                                options={leads.map((lead: any) => ({
                                    value: lead.id,
                                    label: `${lead.firstName} ${lead.lastName}`,
                                    subtitle: lead.company || 'No Company',
                                    searchTerms: `${lead.company || ''} ${lead.firstName} ${lead.lastName}`,
                                }))}
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                            id="companyName"
                            placeholder="Auto-filled from lead"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">Auto-filled from selected lead</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Line Items <span className="text-red-500">*</span></Label>
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
                            placeholder="18"
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
                            placeholder="Additional notes or terms..."
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
                        onClick={handleSubmit}
                        disabled={!isFormValid || submitMutation.isPending || leads.length === 0}
                        className="gap-2"
                    >
                        {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {submitMutation.isPending
                            ? 'Creating...'
                            : `Create ${invoiceType === 'PERFORMA' ? 'Performa' : 'Invoice'}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
