'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const leadSchema = z.object({
    salutation: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    title: z.string().optional(),
    department: z.string().optional(),
    company: z.string().optional(), // Mapped to Account Name
    phone: z.string().optional(), // Office Phone
    mobile: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email('Invalid email address'),
    website: z.string().optional(),

    // Address
    address: z.string().optional(), // Street
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),

    // More Info
    description: z.string().optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
    statusDescription: z.string().optional(),
    source: z.string().optional(),
    sourceDescription: z.string().optional(),
    value: z.number().optional(), // Opportunity Amount
    type: z.enum(['HOT', 'WARM', 'COLD']),

    assigneeId: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function NewLeadPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LeadFormData>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            salutation: '',
            status: 'NEW',
            type: 'COLD',
            source: 'WEBSITE',
        },
    });

    // Fetch team members for assignment
    const { data: teamMembers } = useQuery({
        queryKey: ['team-members'],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
        enabled: user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER',
    });

    const createLeadMutation = useMutation({
        mutationFn: async (data: LeadFormData) => {
            return apiClient.post('/leads', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            toast({
                title: 'Lead created successfully',
                description: 'The new lead has been added to your list.',
            });
            router.push('/leads');
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to create lead',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (data: LeadFormData) => {
        // Convert number strings to numbers if necessary (though z.number should handle it if inputs are managed right)
        // Adjust value for submission
        if (data.value) {
            data.value = Number(data.value);
        }
        createLeadMutation.mutate(data);
    };

    return (
        <div className="space-y-6 page-enter pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                <Button variant="ghost" size="icon" onClick={() => router.push('/leads')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Create Lead</h1>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/leads')}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={createLeadMutation.isPending}
                        className="gap-2"
                    >
                        {createLeadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Overview Panel */}
                <Card>
                    <CardHeader className="bg-muted/40 pb-4 border-b">
                        <CardTitle className="text-lg text-primary">Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
                            {/* Row 1 */}
                            <div className="space-y-2">
                                <Label>Salutation</Label>
                                <Select onValueChange={(val) => setValue('salutation', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Mr.">Mr.</SelectItem>
                                        <SelectItem value="Ms.">Ms.</SelectItem>
                                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                                        <SelectItem value="Dr.">Dr.</SelectItem>
                                        <SelectItem value="Prof.">Prof.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>First Name <span className="text-destructive">*</span></Label>
                                <Input {...register('firstName')} placeholder="John" />
                                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                            </div>

                            {/* Row 2 */}
                            <div className="space-y-2">
                                <Label>Last Name <span className="text-destructive">*</span></Label>
                                <Input {...register('lastName')} placeholder="Doe" />
                                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input {...register('title')} placeholder="CEO, Manager, etc." />
                            </div>

                            {/* Row 3 */}
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Input {...register('department')} placeholder="Sales, Marketing..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Account Name</Label>
                                <Input {...register('company')} placeholder="Company Name" />
                            </div>

                            {/* Row 4 */}
                            <div className="space-y-2">
                                <Label>Office Phone</Label>
                                <Input {...register('phone')} placeholder="+1 234 567 890" />
                            </div>
                            <div className="space-y-2">
                                <Label>Mobile</Label>
                                <Input {...register('mobile')} placeholder="+1 987 654 321" />
                            </div>

                            {/* Row 5 */}
                            <div className="space-y-2">
                                <Label>Fax</Label>
                                <Input {...register('fax')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email <span className="text-destructive">*</span></Label>
                                <Input {...register('email')} type="email" placeholder="john@example.com" />
                                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                            </div>

                            {/* Row 6 */}
                            <div className="space-y-2">
                                <Label>Website</Label>
                                <Input {...register('website')} placeholder="https://example.com" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address Panel */}
                <Card>
                    <CardHeader className="bg-muted/40 pb-4 border-b">
                        <CardTitle className="text-lg text-primary">Address</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
                            <div className="space-y-2 lg:col-span-2">
                                <Label>Street Address</Label>
                                <Input {...register('address')} placeholder="123 Main St" />
                            </div>

                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input {...register('city')} />
                            </div>
                            <div className="space-y-2">
                                <Label>State</Label>
                                <Input {...register('state')} />
                            </div>

                            <div className="space-y-2">
                                <Label>Postal Code</Label>
                                <Input {...register('postalCode')} />
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <Input {...register('country')} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* More Information Panel */}
                <Card>
                    <CardHeader className="bg-muted/40 pb-4 border-b">
                        <CardTitle className="text-lg text-primary">More Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
                            <div className="space-y-2 lg:col-span-2">
                                <Label>Description</Label>
                                <Textarea {...register('description')} rows={3} placeholder="Enter description..." />
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select onValueChange={(val) => setValue('status', val as any)} defaultValue="NEW">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New</SelectItem>
                                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                                        <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                        <SelectItem value="PROPOSAL">Proposal</SelectItem>
                                        <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                                        <SelectItem value="WON">Won</SelectItem>
                                        <SelectItem value="LOST">Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Lead Source</Label>
                                <Select onValueChange={(val) => setValue('source', val)} defaultValue="WEBSITE">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WEBSITE">Website</SelectItem>
                                        <SelectItem value="REFERRAL">Referral</SelectItem>
                                        <SelectItem value="COLD_CALL">Cold Call</SelectItem>
                                        <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                                        <SelectItem value="ADVERTISEMENT">Advertisement</SelectItem>
                                        <SelectItem value="TRADE_SHOW">Trade Show</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Opportunity Amount</Label>
                                <Input
                                    type="number"
                                    {...register('value', { valueAsNumber: true })}
                                    placeholder="0.00"
                                />
                            </div>

                            {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && teamMembers && (
                                <div className="space-y-2">
                                    <Label>Assigned To</Label>
                                    <Select onValueChange={(value) => setValue('assigneeId', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select User" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {teamMembers.map((member: any) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.firstName} {member.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </form>
        </div>
    );
}
