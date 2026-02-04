'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import {
    ArrowLeft,
    Loader2,
    User,
    MapPin,
    Building2,
    Database,
    BadgeCheck,
    Hash,
    Mail,
    CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

// Schema
const leadSchema = z.object({
    salutation: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    mobile: z.string().optional(),
    company: z.string().optional(),

    description: z.string().optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
    source: z.string().optional(),
    type: z.enum(['HOT', 'WARM', 'COLD']),

    assigneeId: z.string().optional(),
    nextFollowUp: z.date().optional(),
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




    const activeFollowUpDate = watch('nextFollowUp');

    // Fetch team members for assignment
    const { data: teamMembers } = useQuery({
        queryKey: ['team-members'],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
        enabled: !!user && (user.role === 'SUPER_ADMIN' || user.role === 'MANAGER'),
    });

    const createLeadMutation = useMutation({
        mutationFn: async (data: LeadFormData) => {
            return apiClient.post('/leads', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            toast({
                title: 'Success',
                description: 'Lead created successfully.',
            });
            router.push('/leads');
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create lead',
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (data: LeadFormData) => {
        createLeadMutation.mutate(data);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-full"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Create New Lead</h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={createLeadMutation.isPending}>
                            {createLeadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Lead
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (8/12) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Primary Contact & Business Mixed for compactness */}
                        <Card>
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    Lead Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name Row */}
                                <div className="space-y-1 md:col-span-2 grid grid-cols-12 gap-4">
                                    <div className="col-span-2">
                                        <Label className="text-xs text-muted-foreground">Prefix</Label>
                                        <Select onValueChange={(val) => setValue('salutation', val)}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="-" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Mr.">Mr.</SelectItem>
                                                <SelectItem value="Ms.">Ms.</SelectItem>
                                                <SelectItem value="Mrs.">Mrs.</SelectItem>
                                                <SelectItem value="Dr.">Dr.</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-5">
                                        <Label className="text-xs text-muted-foreground">First Name <span className="text-red-500">*</span></Label>
                                        <Input {...register('firstName')} placeholder="John" className="h-9" />
                                        {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                                    </div>
                                    <div className="col-span-5">
                                        <Label className="text-xs text-muted-foreground">Last Name <span className="text-red-500">*</span></Label>
                                        <Input {...register('lastName')} placeholder="Doe" className="h-9" />
                                        {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                                    </div>
                                </div>

                                {/* Email & Title */}
                                <div className="grid grid-cols-1 gap-4 md:col-span-2">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Email <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input {...register('email')} className="pl-9 h-9" placeholder="john@example.com" />
                                        </div>
                                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                    </div>
                                </div>

                                {/* Phone Numbers */}
                                <div>
                                    <Label className="text-xs text-muted-foreground">Mobile</Label>
                                    <Input {...register('mobile')} placeholder="+XX XXXXX" className="h-9" />
                                </div>

                                {/* Business Details Section in same card */}
                                <div className="md:col-span-2 pt-2 border-t mt-2">
                                    <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                                        <Building2 className="h-3 w-3" />
                                        Organization
                                    </Label>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Company</Label>
                                            <Input {...register('company')} placeholder="Acme Inc" className="h-9" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes Only */}
                        <Card>
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="w-full">
                                    <Label className="text-xs text-muted-foreground mb-2 block">Additional Details</Label>
                                    <Textarea {...register('description')} placeholder="Internal notes..." className="min-h-[80px]" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (4/12) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Classification */}
                        <Card>
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                    Pipeline Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Lead Status</Label>
                                    <Select onValueChange={(val) => setValue('status', val as any)} defaultValue="NEW">
                                        <SelectTrigger className="h-9">
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
                                <div>
                                    <Label className="text-xs text-muted-foreground">Source</Label>
                                    <Select onValueChange={(val) => setValue('source', val)} defaultValue="WEBSITE">
                                        <SelectTrigger className="h-9">
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
                                <div>
                                    <Label className="text-xs text-muted-foreground">Type</Label>
                                    <Select onValueChange={(val) => setValue('type', val as any)} defaultValue="COLD">
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HOT">Hot 🔥</SelectItem>
                                            <SelectItem value="WARM">Warm ⚡</SelectItem>
                                            <SelectItem value="COLD">Cold ❄️</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <Label className="text-xs text-muted-foreground">Next Follow-up</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "h-9 w-full justify-start text-left font-normal",
                                                    !activeFollowUpDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {activeFollowUpDate ? format(activeFollowUpDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={activeFollowUpDate}
                                                onSelect={(date) => setValue('nextFollowUp', date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Value & Assignment */}
                        <Card>
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-primary" />
                                    Deal Intelligence
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {/* Value Logic Removed */}

                                {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Assignee</Label>
                                        <Select onValueChange={(val) => setValue('assigneeId', val)}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teamMembers?.map((m: any) => (
                                                    <SelectItem key={m.id} value={m.id}>
                                                        {m.firstName} {m.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
