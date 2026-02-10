'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import apiClient from '@/lib/api-client';
import { Plus, Check } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const formSchema = z.object({
    title: z.string().optional(),
    content: z.string().min(10, {
        message: 'Report content must be at least 10 characters.',
    }),
    callCount: z.coerce.number().min(0).optional(),
    avgTalkTime: z.coerce.number().min(0).optional(),
    paymentReceivedFromCustomerIds: z.array(z.string()).optional(),
});

interface CreateReportDialogProps {
    onSuccess: () => void;
}

interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    company?: string;
}

export function CreateReportDialog({ onSuccess }: CreateReportDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            content: '',
            callCount: 0,
            avgTalkTime: 0,
            paymentReceivedFromCustomerIds: [],
        },
    });

    useEffect(() => {
        if (open) {
            fetchCustomers();
        }
    }, [open]);

    const fetchCustomers = async () => {
        try {
            const response = await apiClient.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await apiClient.post('/daily-reports', values);
            toast({
                title: 'Report submitted',
                description: 'Your daily report has been submitted successfully.',
            });
            setOpen(false);
            form.reset();
            onSuccess();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to submit report. Please try again.',
                variant: 'destructive',
            });
            console.error(error);
        }
    }

    const selectedCustomerIds = form.watch('paymentReceivedFromCustomerIds') || [];

    const toggleCustomer = (customerId: string) => {
        const current = form.getValues('paymentReceivedFromCustomerIds') || [];
        const updated = current.includes(customerId)
            ? current.filter(id => id !== customerId)
            : [...current, customerId];
        form.setValue('paymentReceivedFromCustomerIds', updated);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Report
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Daily Report</DialogTitle>
                    <DialogDescription>
                        Submit your daily work summary here.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Sales calls update" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="callCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Call Count</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="avgTalkTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Avg Talk Time (mins)</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="0" step="0.1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormItem className="flex flex-col">
                            <FormLabel>Payments Received From</FormLabel>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between",
                                                !selectedCustomerIds.length && "text-muted-foreground"
                                            )}
                                        >
                                            {selectedCustomerIds.length > 0
                                                ? `${selectedCustomerIds.length} customers selected`
                                                : "Select customers"}
                                            <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search customer..." />
                                        <CommandList>
                                            <CommandEmpty>No customer found.</CommandEmpty>
                                            <CommandGroup>
                                                {customers.map((customer) => (
                                                    <CommandItem
                                                        value={`${customer.firstName} ${customer.lastName} ${customer.company || ''}`}
                                                        key={customer.id}
                                                        onSelect={() => {
                                                            toggleCustomer(customer.id);
                                                            // Keep the popover open for multiple selection
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedCustomerIds.includes(customer.id)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {customer.firstName} {customer.lastName}
                                                        {customer.company && <span className="ml-2 text-muted-foreground">({customer.company})</span>}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Select customers who made a payment today.
                            </FormDescription>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedCustomerIds.map(id => {
                                    const customer = customers.find(c => c.id === id);
                                    if (!customer) return null;
                                    return (
                                        <Badge key={id} variant="secondary" className="pr-1">
                                            {customer.firstName} {customer.lastName}
                                            <button
                                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        toggleCustomer(id);
                                                    }
                                                }}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onClick={() => toggleCustomer(id)}
                                            >
                                                <span className="sr-only">Remove</span>
                                                <Plus className="h-3 w-3 rotate-45" />
                                            </button>
                                        </Badge>
                                    )
                                })}
                            </div>
                        </FormItem>

                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your activities for today..."
                                            className="min-h-[150px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
