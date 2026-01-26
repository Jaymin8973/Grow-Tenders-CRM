'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
    ArrowLeft,
    Loader2,
    Save,
    User,
    Phone,
    MapPin,
    Briefcase,
    Database,
    Globe,
    Mail,
    Building2,
    Hash,
    BadgeCheck
} from 'lucide-react';

const leadSchema = z.object({
    salutation: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    title: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
    company: z.string().optional(),
    industry: z.string().optional(),

    phone: z.string().optional(),
    mobile: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email('Invalid email address'),
    website: z.string().optional(),

    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),

    description: z.string().optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
    source: z.string().optional(),
    value: z.number().optional(),
    type: z.enum(['HOT', 'WARM', 'COLD']),

    assigneeId: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function EditLeadPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        setValue,
        reset,
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

    const { data: leadData, isLoading: isLoadingLead } = useQuery({
        queryKey: ['lead', id],
        queryFn: async () => {
            const response = await apiClient.get(`/leads/${id}`);
            return response.data;
        },
    });

    const { data: teamMembers } = useQuery({
        queryKey: ['team-members'],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
        enabled: !!user && (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER'),
    });

    useEffect(() => {
        if (leadData) {
            reset({
                ...leadData,
                value: leadData.value ? Number(leadData.value) : undefined,
                assigneeId: leadData.assigneeId || undefined,
            });
        }
    }, [leadData, reset]);

    const updateLeadMutation = useMutation({
        mutationFn: async (data: LeadFormData) => {
            return apiClient.patch(`/leads/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            queryClient.invalidateQueries({ queryKey: ['lead', id] });
            toast({
                title: 'Lead updated successfully',
                description: 'The lead details have been updated.',
            });
            router.push(`/leads/${id}`);
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update lead',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (data: LeadFormData) => {
        if (data.value) {
            data.value = Number(data.value);
        }
        updateLeadMutation.mutate(data);
    };

    if (isLoadingLead) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between py-4 bg-background/80 backdrop-blur-md border-b mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Lead</h1>
                        <p className="text-sm text-muted-foreground">Modify the details for {leadData?.firstName} {leadData?.lastName}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={updateLeadMutation.isPending}
                        className="gap-2 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                    >
                        {updateLeadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Primary Information */}
                    <Card className="border-none shadow-md bg-card/50">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Primary Information</CardTitle>
                                <CardDescription>Basic contact details and identity</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-6 gap-6">
                            <div className="md:col-span-1 space-y-2">
                                <Label>Salutation</Label>
                                <Select onValueChange={(val) => setValue('salutation', val)} defaultValue={leadData?.salutation}>
                                    <SelectTrigger className="bg-background/50 border-muted-foreground/20">
                                        <SelectValue placeholder="Prefix" />
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
                            <div className="md:col-span-2 space-y-2">
                                <Label>First Name <span className="text-destructive">*</span></Label>
                                <Input
                                    {...register('firstName')}
                                    placeholder="Enter first name"
                                    className="bg-background/50 border-muted-foreground/20 focus:border-primary transition-all"
                                />
                                {errors.firstName && <p className="text-xs text-destructive font-medium">{errors.firstName.message}</p>}
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <Label>Last Name <span className="text-destructive">*</span></Label>
                                <Input
                                    {...register('lastName')}
                                    placeholder="Enter last name"
                                    className="bg-background/50 border-muted-foreground/20 focus:border-primary transition-all"
                                />
                                {errors.lastName && <p className="text-xs text-destructive font-medium">{errors.lastName.message}</p>}
                            </div>

                            <div className="md:col-span-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <Label>Email Address <span className="text-destructive">*</span></Label>
                                </div>
                                <Input
                                    {...register('email')}
                                    type="email"
                                    placeholder="example@company.com"
                                    className="bg-background/50 border-muted-foreground/20 focus:border-primary transition-all"
                                />
                                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
                            </div>

                            <div className="md:col-span-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <Label>Job Title</Label>
                                </div>
                                <Input
                                    {...register('position')}
                                    placeholder="e.g. CEO, Sales Manager"
                                    className="bg-background/50 border-muted-foreground/20 focus:border-primary transition-all"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Business Details */}
                    <Card className="border-none shadow-md bg-card/50">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Business Details</CardTitle>
                                <CardDescription>Company and professional information</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Account Name / Company</Label>
                                <Input
                                    {...register('company')}
                                    placeholder="Company name"
                                    className="bg-background/50 border-muted-foreground/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Input
                                    {...register('department')}
                                    placeholder="e.g. Procurement, IT"
                                    className="bg-background/50 border-muted-foreground/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Industry</Label>
                                <Input
                                    {...register('industry')}
                                    placeholder="e.g. Manufacturing, Retail"
                                    className="bg-background/50 border-muted-foreground/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <Label>Website</Label>
                                </div>
                                <Input
                                    {...register('website')}
                                    placeholder="https://"
                                    className="bg-background/50 border-muted-foreground/20"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Information */}
                    <Card className="border-none shadow-md bg-card/50">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Address Details</CardTitle>
                                <CardDescription>Physical location and mailing address</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-6">
                            <div className="space-y-2">
                                <Label>Street Address</Label>
                                <Input
                                    {...register('address')}
                                    placeholder="Unit #, Street address"
                                    className="bg-background/50 border-muted-foreground/20"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input {...register('city')} placeholder="City" className="bg-background/50 border-muted-foreground/20" />
                                </div>
                                <div className="space-y-2">
                                    <Label>State / Province</Label>
                                    <Input {...register('state')} placeholder="State" className="bg-background/50 border-muted-foreground/20" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Postal Code</Label>
                                    <Input {...register('postalCode')} placeholder="Zip Code" className="bg-background/50 border-muted-foreground/20" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <Input {...register('country')} placeholder="Country" className="bg-background/50 border-muted-foreground/20" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    <Card className="border-none shadow-md bg-card/50">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Database className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Internal Notes</CardTitle>
                                <CardDescription>Additional context and background</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <Textarea
                                {...register('description')}
                                rows={4}
                                placeholder="Describe the lead's needs, history, or specific requirements..."
                                className="bg-background/50 border-muted-foreground/20 resize-none focus:ring-1 focus:ring-primary"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Status & Intelligence */}
                <div className="space-y-8">

                    {/* Contact Channels */}
                    <Card className="border-none shadow-md bg-card/50">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                Contact Channels
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Mobile Number</Label>
                                <Input {...register('mobile')} placeholder="+XX XXXXX XXXXX" className="bg-background/50 border-muted-foreground/20" />
                            </div>
                            <div className="space-y-2">
                                <Label>Office Phone</Label>
                                <Input {...register('phone')} placeholder="+XX XXX XXXXXX" className="bg-background/50 border-muted-foreground/20" />
                            </div>
                            <div className="space-y-2">
                                <Label>Fax</Label>
                                <Input {...register('fax')} placeholder="Fax number" className="bg-background/50 border-muted-foreground/20" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lead Classification */}
                    <Card className="border-none shadow-md bg-card/50">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BadgeCheck className="h-4 w-4 text-primary" />
                                Classification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select onValueChange={(val) => setValue('status', val as any)} defaultValue={leadData?.status || 'NEW'}>
                                    <SelectTrigger className="bg-background/50 border-muted-foreground/20">
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
                                <Label>Lead Type</Label>
                                <Select onValueChange={(val) => setValue('type', val as any)} defaultValue={leadData?.type || 'COLD'}>
                                    <SelectTrigger className="bg-background/50 border-muted-foreground/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HOT">Hot 🔥</SelectItem>
                                        <SelectItem value="WARM">Warm ⚡</SelectItem>
                                        <SelectItem value="COLD">Cold ❄️</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Lead Source</Label>
                                <Select onValueChange={(val) => setValue('source', val)} defaultValue={leadData?.source || 'WEBSITE'}>
                                    <SelectTrigger className="bg-background/50 border-muted-foreground/20">
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
                        </CardContent>
                    </Card>

                    {/* Opportunity Value */}
                    <Card className="border-none shadow-md bg-card/50 overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader className="pb-3 border-b border-primary/10">
                            <CardTitle className="text-base flex items-center gap-2 text-primary font-semibold">
                                <Hash className="h-4 w-4" />
                                Economic Value
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-2">
                                <Label>Opportunity Amount</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">$</span>
                                    <Input
                                        type="number"
                                        {...register('value', { valueAsNumber: true })}
                                        placeholder="0.00"
                                        className="pl-7 bg-background/70 border-primary/20 focus:border-primary font-semibold text-lg"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignment */}
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                        <Card className="border-none shadow-md bg-card/50">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    Assignment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    <Label>Assign To User</Label>
                                    {teamMembers ? (
                                        <Select onValueChange={(value) => setValue('assigneeId', value)} defaultValue={leadData?.assigneeId}>
                                            <SelectTrigger className="bg-background/50 border-muted-foreground/20">
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
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 p-2 rounded border border-dashed">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Loading owners...
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </form>
        </div>
    );
}
