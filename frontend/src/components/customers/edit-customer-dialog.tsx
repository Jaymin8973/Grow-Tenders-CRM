'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    company: z.string().optional(),
    position: z.string().optional(),
});

interface EditCustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: any;
}

export function EditCustomerDialog({ open, onOpenChange, customer }: EditCustomerDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            company: '',
            position: '',
        },
    });

    // Reset form when customer changes
    useEffect(() => {
        if (customer) {
            form.reset({
                firstName: customer.firstName || '',
                lastName: customer.lastName || '',
                email: customer.email || '',
                phone: customer.phone || '',
                company: customer.company || '',
                position: customer.position || '',
            });
        }
    }, [customer, form]);

    const updateCustomerMutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const { data } = await apiClient.patch(`/customers/${customer.id}`, values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast({ title: 'Customer updated successfully' });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update customer',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        updateCustomerMutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="firstName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="firstName"
                                placeholder="John"
                                {...form.register('firstName')}
                            />
                            {form.formState.errors.firstName && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.firstName.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="lastName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="lastName"
                                placeholder="Doe"
                                {...form.register('lastName')}
                            />
                            {form.formState.errors.lastName && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.lastName.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="email"
                            placeholder="john@example.com"
                            {...form.register('email')}
                        />
                        {form.formState.errors.email && (
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Phone
                            </label>
                            <Input
                                id="phone"
                                placeholder="+1 234..."
                                {...form.register('phone')}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="company" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Company
                            </label>
                            <Input
                                id="company"
                                placeholder="Acme Inc"
                                {...form.register('company')}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="position" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Position
                        </label>
                        <Input
                            id="position"
                            placeholder="Manager"
                            {...form.register('position')}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateCustomerMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateCustomerMutation.isPending}>
                            {updateCustomerMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Customer'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
