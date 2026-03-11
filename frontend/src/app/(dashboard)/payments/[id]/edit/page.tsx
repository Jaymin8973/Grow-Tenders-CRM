'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    ArrowLeft,
    Save,
    Loader2,
    IndianRupee,
    Building2,
    Phone,
    Calculator,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CARD', label: 'Card' },
    { value: 'OTHER', label: 'Other' },
];

export default function EditPaymentPage() {
    const router = useRouter();
    const params = useParams();
    const paymentId = params.id as string;
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: payment, isLoading: paymentLoading } = useQuery({
        queryKey: ['payment', paymentId],
        queryFn: async () => {
            const response = await apiClient.get(`/payments/${paymentId}`);
            return response.data;
        },
        enabled: !!paymentId,
    });

    const [formData, setFormData] = useState({
        customerId: '',
        leadId: '',
        companyName: '',
        phone: '',
        amount: '',
        gstType: 'WITHOUT_GST' as 'WITH_GST' | 'WITHOUT_GST',
        gstPercentage: '18',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        referenceNumber: '',
        notes: '',
        invoiceId: '',
    });

    const [gstAmount, setGstAmount] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    // Fetch customers for dropdown
    const { data: customers } = useQuery({
        queryKey: ['customers-list'],
        queryFn: async () => {
            const response = await apiClient.get('/customers');
            const data = response.data;
            return Array.isArray(data) ? data : data?.items || [];
        },
    });

    // Fetch leads for dropdown
    const { data: leads } = useQuery({
        queryKey: ['leads-list'],
        queryFn: async () => {
            const response = await apiClient.get('/leads');
            const data = response.data;
            return Array.isArray(data) ? data : data?.items || [];
        },
    });

    // Pre-fill form when payment data loads
    useEffect(() => {
        if (payment) {
            // If payment has invoice with lead, pre-fill lead
            const invoiceLeadId = payment.invoice?.leadId || '';
            setFormData({
                customerId: payment.customerId || '',
                leadId: invoiceLeadId,
                companyName: payment.companyName || '',
                phone: payment.phone || '',
                amount: String(payment.amount || ''),
                gstType: payment.gstType || 'WITHOUT_GST',
                gstPercentage: String(payment.gstPercentage || 18),
                paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
                paymentMethod: payment.paymentMethod || 'CASH',
                referenceNumber: payment.referenceNumber || '',
                notes: payment.notes || '',
                invoiceId: payment.invoiceId || '',
            });
        }
    }, [payment]);

    // Calculate GST and Total
    useEffect(() => {
        const amount = parseFloat(formData.amount) || 0;
        const gstPercent = parseFloat(formData.gstPercentage) || 18;

        if (formData.gstType === 'WITH_GST') {
            const gst = (amount * gstPercent) / 100;
            setGstAmount(gst);
            setTotalAmount(amount + gst);
        } else {
            setGstAmount(0);
            setTotalAmount(amount);
        }
    }, [formData.amount, formData.gstType, formData.gstPercentage]);

    // Auto-fill customer details when selected
    useEffect(() => {
        if (formData.customerId && customers) {
            const customer = customers.find((c: any) => c.id === formData.customerId);
            if (customer) {
                setFormData(prev => ({
                    ...prev,
                    companyName: customer.company || '',
                    phone: customer.phone || '',
                    leadId: '', // Clear lead when customer selected
                }));
            }
        }
    }, [formData.customerId, customers]);

    // Auto-fill lead details when selected
    useEffect(() => {
        if (formData.leadId && leads) {
            const lead = leads.find((l: any) => l.id === formData.leadId);
            if (lead) {
                setFormData(prev => ({
                    ...prev,
                    companyName: lead.company || '',
                    phone: lead.phone || '',
                    customerId: '', // Clear customer when lead selected
                }));
            }
        }
    }, [formData.leadId, leads]);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.patch(`/payments/${paymentId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['payment', paymentId] });
            queryClient.invalidateQueries({ queryKey: ['payments-stats'] });
            toast({
                title: 'Success',
                description: 'Payment updated successfully!',
            });
            router.push('/payments');
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update payment',
                description: getErrorMessage(error),
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedCustomer = customers?.find((c: any) => c.id === formData.customerId);

        updateMutation.mutate({
            customerId: formData.customerId || null,
            companyName: selectedCustomer?.company || formData.companyName,
            phone: selectedCustomer?.phone || formData.phone,
            amount: parseFloat(formData.amount) || 0,
            gstType: formData.gstType,
            gstPercentage: parseFloat(formData.gstPercentage) || 18,
            paymentDate: formData.paymentDate,
            paymentMethod: formData.paymentMethod,
            referenceNumber: formData.referenceNumber || undefined,
            notes: formData.notes || undefined,
            invoiceId: formData.invoiceId || undefined,
        });
    };

    if (paymentLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Payment not found</h2>
                    <Button className="mt-4" onClick={() => router.push('/payments')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Payments
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 page-enter max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Edit Payment</h1>
                    <p className="text-muted-foreground mt-1">
                        Update payment details
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Customer Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Select Customer</Label>
                                <Select
                                    value={formData.customerId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers?.map((customer: any) => (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                {customer.firstName} {customer.lastName}
                                                {customer.company && ` - ${customer.company}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Or Select Lead</Label>
                                <Select
                                    value={formData.leadId}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, leadId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a lead" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leads?.map((lead: any) => (
                                            <SelectItem key={lead.id} value={lead.id}>
                                                {lead.firstName} {lead.lastName}
                                                {lead.company && ` (${lead.company})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                    placeholder="Company name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="Enter phone number"
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Amount & GST */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Amount & GST
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount *</Label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                        placeholder="Enter amount"
                                        className="pl-10"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>GST Type *</Label>
                                <RadioGroup
                                    value={formData.gstType}
                                    onValueChange={(value: string) => setFormData(prev => ({
                                        ...prev,
                                        gstType: value as 'WITH_GST' | 'WITHOUT_GST'
                                    }))}
                                    className="flex gap-6 pt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="WITH_GST" id="with-gst" />
                                        <Label htmlFor="with-gst" className="cursor-pointer">With GST</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="WITHOUT_GST" id="without-gst" />
                                        <Label htmlFor="without-gst" className="cursor-pointer">Without GST</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>

                        {formData.gstType === 'WITH_GST' && (
                            <div className="space-y-2">
                                <Label htmlFor="gstPercentage">GST Percentage</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="gstPercentage"
                                        type="number"
                                        value={formData.gstPercentage}
                                        onChange={(e) => setFormData(prev => ({ ...prev, gstPercentage: e.target.value }))}
                                        className="w-24"
                                        min="0"
                                        max="100"
                                    />
                                    <span className="text-muted-foreground">%</span>
                                </div>
                            </div>
                        )}

                        {/* Amount Summary */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Base Amount</span>
                                <span className="font-medium">₹{(parseFloat(formData.amount) || 0).toFixed(2)}</span>
                            </div>
                            {formData.gstType === 'WITH_GST' && (
                                <div className="flex justify-between text-sm">
                                    <span>GST ({formData.gstPercentage}%)</span>
                                    <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                <span>Total Amount</span>
                                <span className="text-emerald-600">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IndianRupee className="h-5 w-5" />
                            Payment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="paymentDate">Payment Date *</Label>
                                <Input
                                    id="paymentDate"
                                    type="date"
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method *</Label>
                                <Select
                                    value={formData.paymentMethod}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((method) => (
                                            <SelectItem key={method.value} value={method.value}>
                                                {method.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="referenceNumber">Reference Number</Label>
                            <Input
                                id="referenceNumber"
                                value={formData.referenceNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                placeholder="Transaction ID, Cheque No., etc."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional notes about this payment..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                        {updateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Update Payment
                    </Button>
                </div>
            </form>
        </div>
    );
}
