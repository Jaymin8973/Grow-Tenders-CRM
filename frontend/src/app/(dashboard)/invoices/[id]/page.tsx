'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ArrowLeft,
    Plus,
    X,
    Download,
    Mail,
    Save,
    Send,
    FileText,
    Building2,
    User,
    Trash2,
    Loader2,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}



export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const invoiceId = params.id as string;
    const isNew = invoiceId === 'new';
    const { user } = useAuth();


    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: '1', description: '', quantity: 1, rate: 0, amount: 0 },
    ]);
    const [discount, setDiscount] = useState(0);
    const [taxRate, setTaxRate] = useState(18);
    const [notes, setNotes] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [emailOpen, setEmailOpen] = useState(false);
    const [emailBody, setEmailBody] = useState('');

    // Fetch invoice if editing
    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async () => {
            if (isNew) return null;
            const response = await apiClient.get(`/invoices/${invoiceId}`);
            return response.data;
        },
        enabled: !isNew,
    });

    // Fetch customers for dropdown
    const { data: customers } = useQuery({
        queryKey: ['customers-dropdown'],
        queryFn: async () => {
            const response = await apiClient.get('/customers?limit=100');
            return response.data;
        },
    });

    // Pre-fill form when editing
    useEffect(() => {
        if (invoice) {
            if (invoice.lineItems?.length) {
                setLineItems(invoice.lineItems.map((item: any, idx: number) => ({
                    id: String(idx + 1),
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.unitPrice,
                    amount: item.quantity * item.unitPrice,
                })));
            }
            setDiscount(invoice.discount || 0);
            setTaxRate(invoice.taxRate || 18);
            setNotes(invoice.notes || '');
            setSelectedCustomerId(invoice.customerId || '');
        }
    }, [invoice]);



    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;

    // Add line item
    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: String(Date.now()), description: '', quantity: 1, rate: 0, amount: 0 },
        ]);
    };

    // Remove line item
    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    // Update line item
    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    updated.amount = updated.quantity * updated.rate;
                }
                return updated;
            }
            return item;
        }));
    };

    // Save (create/update) invoice mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const selectedCustomer = customers?.find((c: any) => c.id === selectedCustomerId);
            const payload: any = {
                customerId: selectedCustomerId,
                companyName: selectedCustomer?.company || 'N/A',
                taxRate,
                discount: discount || undefined,
                discountType: discount ? 'percentage' : undefined,
                notes: notes || undefined,
                lineItems: lineItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.rate,
                })),
            };

            if (isNew) {
                return apiClient.post('/invoices', payload);
            } else {
                return apiClient.patch(`/invoices/${invoiceId}`, payload);
            }
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast({ title: isNew ? 'Invoice created' : 'Invoice updated' });
            if (isNew) {
                router.push(`/invoices/${response.data.id}`);
            }
        },
        onError: () => {
            toast({ title: 'Failed to save invoice', variant: 'destructive' });
        },
    });



    // Download PDF mutation
    const downloadPdfMutation = useMutation({
        mutationFn: async () => {
            const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        },
        onSuccess: () => {
            toast({ title: 'PDF downloaded' });
        },
        onError: () => {
            toast({ title: 'Failed to download PDF', variant: 'destructive' });
        },
    });

    // Send email mutation
    const sendEmailMutation = useMutation({
        mutationFn: async () => {
            return apiClient.post(`/invoices/${invoiceId}/email`, { to: selectedCustomer?.email });
        },
        onSuccess: () => {
            setEmailOpen(false);
            setEmailBody('');
            toast({ title: 'Invoice sent via email' });
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

    const status = { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    const selectedCustomer = customers?.find((c: any) => c.id === selectedCustomerId);

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">
                            {isNew ? 'New Invoice' : `Invoice ${invoice?.invoiceNumber}`}
                        </h1>
                        {!isNew && (
                            <Badge className={cn(status.bg, status.color, 'border-0')}>
                                {status.label}
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        {isNew ? 'Create a new invoice' : 'Edit invoice details'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {!isNew && (
                        <>
                            <Button variant="outline" className="gap-2" onClick={() => downloadPdfMutation.mutate()}>
                                <Download className="h-4 w-4" />
                                PDF
                            </Button>
                            <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Send Invoice via Email</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <Label>To</Label>
                                            <Input value={selectedCustomer?.email || ''} disabled />
                                        </div>
                                        <div>
                                            <Label>Message (optional)</Label>
                                            <Textarea
                                                placeholder="Add a personal message..."
                                                rows={4}
                                                value={emailBody}
                                                onChange={(e) => setEmailBody(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            className="w-full gap-2"
                                            onClick={() => sendEmailMutation.mutate()}
                                            disabled={sendEmailMutation.isPending}
                                        >
                                            {sendEmailMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                            Send Invoice
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                    <Button
                        className="gap-2"
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending || !selectedCustomerId || (!isNew && user?.role !== 'SUPER_ADMIN')}
                    >
                        {saveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Customer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers?.map((customer: any) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                {customer.firstName} {customer.lastName}
                                                {customer.company && (
                                                    <span className="text-muted-foreground">
                                                        ({customer.company})
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedCustomer && (
                                <div className="mt-4 p-4 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Building2 className="h-4 w-4" />
                                        {selectedCustomer.company || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedCustomer.email}</p>
                                    {selectedCustomer.address && (
                                        <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Line Items */}
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-lg">Line Items</CardTitle>
                            <Button variant="outline" size="sm" className="gap-2" onClick={addLineItem}>
                                <Plus className="h-4 w-4" />
                                Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Description</TableHead>
                                        <TableHead className="w-[15%]">Qty</TableHead>
                                        <TableHead className="w-[20%]">Rate</TableHead>
                                        <TableHead className="w-[15%] text-right">Amount</TableHead>
                                        <TableHead className="w-[10%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lineItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Input
                                                    placeholder="Item description"
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                    className="border-0 focus-visible:ring-1"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="border-0 focus-visible:ring-1 w-20"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.rate}
                                                    onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="border-0 focus-visible:ring-1"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(item.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeLineItem(item.id)}
                                                    disabled={lineItems.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Add notes or terms visible to customer..."
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-6">
                    {/* Invoice Date */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Invoice Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                readOnly
                                value={invoice?.createdAt
                                    ? new Date(invoice.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })
                                    : new Date().toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })
                                }
                            />
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Discount (%)</span>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right"
                                />
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Tax Rate (%)</span>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right"
                                />
                            </div>
                            {taxRate > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>+{formatCurrency(taxAmount)}</span>
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Actions - Removed as per workflow simplification */}
                </div>
            </div>
        </div>
    );
}
