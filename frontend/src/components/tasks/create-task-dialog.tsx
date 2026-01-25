'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    CalendarIcon,
    Plus,
    CheckSquare,
    Phone,
    Users,
    Mail,
    FileText,
    DollarSign,
    UserPlus,
    Clock,
    AlignLeft,
    Type
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';

interface CreateTaskDialogProps {
    children?: React.ReactNode;
    leadId?: string;
    customerId?: string;
    onSuccess?: () => void;
}

export function CreateTaskDialog({ children, leadId, customerId, onSuccess }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [type, setType] = useState<string>('TASK');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState<Date>();
    const [assigneeId, setAssigneeId] = useState<string>('');

    // Fetch potential assignees (employees)
    const { data: employees } = useQuery({
        queryKey: ['users', 'employees'],
        queryFn: async () => {
            const response = await apiClient.get('/users?role=EMPLOYEE');
            return response.data;
        },
    });

    const createTaskMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.post('/activities', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            if (leadId) queryClient.invalidateQueries({ queryKey: ['activities', 'lead', leadId] });

            setOpen(false);
            // Reset form
            setTitle('');
            setType('TASK');
            setDescription('');
            setDate(undefined);
            setAssigneeId('');

            toast({ title: 'Task created successfully', className: "bg-emerald-500 text-white border-0" });
            if (onSuccess) onSuccess();
        },
        onError: () => {
            toast({ title: 'Failed to create task', variant: 'destructive' });
        },
    });

    const handleSubmit = () => {
        if (!title || !assigneeId || !date) {
            toast({ title: 'Please fill in all required fields', variant: 'destructive' });
            return;
        }

        createTaskMutation.mutate({
            title,
            type,
            description,
            scheduledAt: date.toISOString(),
            assigneeId,
            leadId,
            customerId,
            status: 'SCHEDULED'
        });
    };

    const getTypeIcon = (t: string) => {
        switch (t) {
            case 'CALL': return <Phone className="mr-2 h-4 w-4" />;
            case 'MEETING': return <Users className="mr-2 h-4 w-4" />;
            case 'EMAIL': return <Mail className="mr-2 h-4 w-4" />;
            case 'INVOICE': return <FileText className="mr-2 h-4 w-4" />;
            case 'PAYMENT': return <DollarSign className="mr-2 h-4 w-4" />;
            case 'LEAD': return <UserPlus className="mr-2 h-4 w-4" />;
            default: return <CheckSquare className="mr-2 h-4 w-4" />;
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gap-2 shadow-sm">
                        <Plus className="h-4 w-4" />
                        Create Task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-0 shadow-2xl">
                <div className="bg-primary/5 p-6 border-b">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-primary">
                            <Plus className="h-6 w-6" />
                            Create New Task
                        </DialogTitle>
                        <DialogDescription>
                            Schedule a new activity, meeting, or follow-up.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="grid gap-6 p-6">
                    {/* Task Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold text-muted-foreground ml-1">Title</Label>
                        <div className="relative">
                            <Type className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="title"
                                placeholder="E.g., Call client regarding renewal"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="pl-10 h-10 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Task Type */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-muted-foreground ml-1">Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-10 border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TASK"><div className="flex items-center"><CheckSquare className="mr-2 h-4 w-4 text-slate-500" /> General Task</div></SelectItem>
                                    <SelectItem value="CALL"><div className="flex items-center"><Phone className="mr-2 h-4 w-4 text-blue-500" /> Call</div></SelectItem>
                                    <SelectItem value="MEETING"><div className="flex items-center"><Users className="mr-2 h-4 w-4 text-purple-500" /> Meeting</div></SelectItem>
                                    <SelectItem value="EMAIL"><div className="flex items-center"><Mail className="mr-2 h-4 w-4 text-orange-500" /> Email</div></SelectItem>
                                    <SelectItem value="INVOICE"><div className="flex items-center"><FileText className="mr-2 h-4 w-4 text-green-500" /> Invoice</div></SelectItem>
                                    <SelectItem value="PAYMENT"><div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-emerald-600" /> Payment</div></SelectItem>
                                    <SelectItem value="LEAD"><div className="flex items-center"><UserPlus className="mr-2 h-4 w-4 text-pink-500" /> Lead Follow-up</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-muted-foreground ml-1">Scheduled For</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal h-10 border-gray-200",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "P") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Assignee */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-muted-foreground ml-1">Assign To</Label>
                        <Select value={assigneeId} onValueChange={setAssigneeId}>
                            <SelectTrigger className="pl-3 h-10 border-gray-200">
                                <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees?.map((emp: any) => (
                                    <SelectItem key={emp.id} value={emp.id} className="cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {emp.firstName?.[0]}
                                            </div>
                                            {emp.firstName} {emp.lastName}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-muted-foreground ml-1">Details</Label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Textarea
                                id="description"
                                placeholder="Add context, meeting notes, or specific instructions..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="pl-10 min-h-[100px] border-gray-200 resize-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-gray-50/50 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={createTaskMutation.isPending}
                        className="w-full sm:w-auto gap-2"
                    >
                        {createTaskMutation.isPending ? (
                            <>Creating...</>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" /> Create Task
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
