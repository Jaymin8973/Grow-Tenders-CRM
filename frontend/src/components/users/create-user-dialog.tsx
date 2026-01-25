'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    Plus,
    User,
    Mail,
    Lock,
    Phone,
    Shield,
    Users,
    Briefcase
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CreateUserDialogProps {
    children?: React.ReactNode;
    onSuccess?: () => void;
}

export function CreateUserDialog({ children, onSuccess }: CreateUserDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'EMPLOYEE',
        managerId: 'none',
    });

    // Fetch managers for assignment
    const { data: managers } = useQuery({
        queryKey: ['users', 'managers'],
        queryFn: async () => {
            const response = await apiClient.get('/users/managers');
            return response.data;
        },
        enabled: open, // Only fetch when dialog opens
    });

    const createUserMutation = useMutation({
        mutationFn: async (data: any) => {
            // Remove managerId if it's 'none' or empty
            const payload = { ...data };
            if (payload.managerId === 'none' || !payload.managerId) {
                delete payload.managerId;
            }
            return apiClient.post('/users', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setOpen(false);
            setFormData({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                phone: '',
                role: 'EMPLOYEE',
                managerId: 'none',
            });
            toast({ title: 'User created successfully' });
            if (onSuccess) onSuccess();
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to create user',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        },
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
            toast({ title: 'Please fill in all required fields', variant: 'destructive' });
            return;
        }
        createUserMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md">
                        <Plus className="h-4 w-4" />
                        Add User
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <UserPlusIcon className="h-5 w-5 text-primary" />
                        </div>
                        Add New Team Member
                    </DialogTitle>
                    <DialogDescription>
                        Create a new user account and assign their role and manager.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-6">
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary/80">
                            <User className="h-4 w-4" />
                            <span>Personal Information</span>
                        </div>
                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        className="pl-9"
                                        value={formData.firstName}
                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="lastName"
                                        placeholder="Doe"
                                        className="pl-9"
                                        value={formData.lastName}
                                        onChange={(e) => handleChange('lastName', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        className="pl-9"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        placeholder="+1 (555) 000-0000"
                                        className="pl-9"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Security & Role Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary/80">
                            <Shield className="h-4 w-4" />
                            <span>Account & Role</span>
                        </div>
                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Must be at least 6 characters long.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Select Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val) => handleChange('role', val)}
                                >
                                    <SelectTrigger className="pl-9 relative">
                                        <Briefcase className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                        <SelectItem value="MANAGER">Manager</SelectItem>
                                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Assign Manager</Label>
                                <Select
                                    value={formData.managerId}
                                    onValueChange={(val) => handleChange('managerId', val)}
                                    disabled={formData.role === 'SUPER_ADMIN' || formData.role === 'MANAGER'}
                                >
                                    <SelectTrigger className="pl-9 relative">
                                        <Users className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Select manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Manager</SelectItem>
                                        {managers?.map((mgr: any) => (
                                            <SelectItem key={mgr.id} value={mgr.id}>
                                                {mgr.firstName} {mgr.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={createUserMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {createUserMutation.isPending ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Icon component helper
function UserPlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    )
}
