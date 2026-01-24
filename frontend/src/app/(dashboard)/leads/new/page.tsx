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
import { ArrowLeft, Loader2, Save } from 'lucide-react';

const leadSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    company: z.string().optional(),
    position: z.string().optional(),
    type: z.enum(['HOT', 'WARM', 'COLD']),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
    source: z.string().optional(),
    value: z.number().min(0).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    website: z.string().optional(),
    notes: z.string().optional(),
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
            type: 'COLD',
            status: 'NEW',
            value: 0,
        },
    });

    // Fetch team members for assignment (for managers)
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
        createLeadMutation.mutate(data);
    };

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/leads')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Add New Lead</h1>
                    <p className="text-muted-foreground">Create a new potential customer</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input
                                        id="firstName"
                                        {...register('firstName')}
                                        placeholder="John"
                                    />
                                    {errors.firstName && (
                                        <p className="text-sm text-destructive">{errors.firstName.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input
                                        id="lastName"
                                        {...register('lastName')}
                                        placeholder="Doe"
                                    />
                                    {errors.lastName && (
                                        <p className="text-sm text-destructive">{errors.lastName.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register('email')}
                                    placeholder="john.doe@example.com"
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    {...register('phone')}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company</Label>
                                    <Input
                                        id="company"
                                        {...register('company')}
                                        placeholder="Acme Corp"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position">Position</Label>
                                    <Input
                                        id="position"
                                        {...register('position')}
                                        placeholder="CEO"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    {...register('website')}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lead Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Lead Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Lead Type *</Label>
                                    <Select
                                        defaultValue="COLD"
                                        onValueChange={(value) => setValue('type', value as any)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HOT">🔥 Hot</SelectItem>
                                            <SelectItem value="WARM">🌡️ Warm</SelectItem>
                                            <SelectItem value="COLD">❄️ Cold</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status *</Label>
                                    <Select
                                        defaultValue="NEW"
                                        onValueChange={(value) => setValue('status', value as any)}
                                    >
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
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="source">Source</Label>
                                    <Input
                                        id="source"
                                        {...register('source')}
                                        placeholder="Website, Referral, etc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="value">Estimated Value ($)</Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        {...register('value', { valueAsNumber: true })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && teamMembers && (
                                <div className="space-y-2">
                                    <Label>Assign To</Label>
                                    <Select onValueChange={(value) => setValue('assigneeId', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select team member" />
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

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        {...register('city')}
                                        placeholder="New York"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        {...register('state')}
                                        placeholder="NY"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        {...register('country')}
                                        placeholder="USA"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    {...register('notes')}
                                    placeholder="Additional notes about this lead..."
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/leads')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={createLeadMutation.isPending}
                        className="gap-2"
                    >
                        {createLeadMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Create Lead
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
