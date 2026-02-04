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
    User,
    Mail,
    Lock,
    Phone,
    Shield,
    Users,
    Briefcase,
    Edit
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface EditUserDialogProps {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role: string;
        managerId?: string;
        isActive: boolean;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user: userData, open, onOpenChange }: EditUserDialogProps) {
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

    // Initialize form data when user changes
    useEffect(() => {
        if (userData) {
            setFormData({
                email: userData.email || '',
                password: '',
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                phone: userData.phone || '',
                role: userData.role || 'EMPLOYEE',
                managerId: userData.managerId || 'none',
            });
        }
    }, [userData, open]);

    // Fetch managers for assignment
    const { data: managers } = useQuery({
        queryKey: ['users', 'managers'],
        queryFn: async () => {
            const response = await apiClient.get('/users/managers');
            return response.data;
        },
        enabled: open,
    });

    const updateUserMutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = { ...data };
            // Remove empty password
            if (!payload.password) {
                delete payload.password;
            }
            // Remove managerId if it's 'none' or empty
            if (payload.managerId === 'none' || !payload.managerId) {
                payload.managerId = null;
            }
            return apiClient.patch(`/users/${userData.id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onOpenChange(false);
            toast({ title: 'User updated successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update user',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive'
            });
        },
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!formData.email || !formData.firstName || !formData.lastName) {
            toast({ title: 'Please fill in all required fields', variant: 'destructive' });
            return;
        }
        updateUserMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Edit className="h-5 w-5 text-primary" />
                        </div>
                        Edit User
                    </DialogTitle>
                    <DialogDescription>
                        Update user account details and role.
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
                            <Label htmlFor="password">New Password <span className="text-muted-foreground text-xs">(leave blank to keep current)</span></Label>
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
                                        {managers?.filter((mgr: any) => mgr.id !== userData.id).map((mgr: any) => (
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={updateUserMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
