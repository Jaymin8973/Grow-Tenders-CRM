'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Send,
    Paperclip,
    X,
    ChevronDown,
    ChevronUp,
    Loader2,
    FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailComposeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    to?: string;
    toName?: string;
    leadId?: string;
    customerId?: string;
    tenderId?: string;
    invoiceId?: string;
}

export function EmailComposeDialog({
    open,
    onOpenChange,
    to = '',
    toName = '',
    leadId,
    customerId,
    tenderId,
    invoiceId,
}: EmailComposeDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [toEmail, setToEmail] = useState(to);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');

    // Reset form when dialog opens with new recipient
    useState(() => {
        if (open) {
            setToEmail(to);
            setSubject('');
            setBody('');
            setCc('');
            setBcc('');
            setSelectedTemplate('');
        }
    });

    // Fetch email templates
    const { data: templates } = useQuery({
        queryKey: ['email-templates'],
        queryFn: async () => {
            const response = await apiClient.get('/email/templates');
            return response.data;
        },
        enabled: open,
    });

    // Send email mutation
    const sendEmailMutation = useMutation({
        mutationFn: async (data: {
            to: string;
            cc?: string[];
            bcc?: string[];
            subject: string;
            body: string;
            leadId?: string;
            customerId?: string;
            tenderId?: string;
            invoiceId?: string;
        }) => {
            return apiClient.post('/email/send', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-logs'] });
            toast({ title: 'Email sent successfully!' });
            onOpenChange(false);
            // Reset form
            setSubject('');
            setBody('');
            setCc('');
            setBcc('');
            setSelectedTemplate('');
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to send email',
                description: error.response?.data?.message || 'Please try again',
                variant: 'destructive',
            });
        },
    });

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = templates?.find((t: any) => t.id === templateId);
        if (template) {
            setSubject(template.subject || '');
            setBody(template.body || '');
        }
    };

    const handleSend = () => {
        if (!toEmail || !subject || !body) {
            toast({
                title: 'Missing required fields',
                description: 'Please fill in To, Subject and Body',
                variant: 'destructive',
            });
            return;
        }

        sendEmailMutation.mutate({
            to: toEmail,
            cc: cc ? cc.split(',').map((e) => e.trim()) : undefined,
            bcc: bcc ? bcc.split(',').map((e) => e.trim()) : undefined,
            subject,
            body,
            leadId,
            customerId,
            tenderId,
            invoiceId,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        New Email
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {/* To Field */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="to">To *</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6"
                                onClick={() => setShowCcBcc(!showCcBcc)}
                            >
                                Cc / Bcc
                                {showCcBcc ? (
                                    <ChevronUp className="h-3 w-3 ml-1" />
                                ) : (
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                )}
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                id="to"
                                type="email"
                                placeholder="recipient@example.com"
                                value={toEmail}
                                onChange={(e) => setToEmail(e.target.value)}
                            />
                            {toName && (
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    ({toName})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* CC/BCC Fields */}
                    {showCcBcc && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="cc">Cc</Label>
                                <Input
                                    id="cc"
                                    type="text"
                                    placeholder="Separate multiple emails with comma"
                                    value={cc}
                                    onChange={(e) => setCc(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bcc">Bcc</Label>
                                <Input
                                    id="bcc"
                                    type="text"
                                    placeholder="Separate multiple emails with comma"
                                    value={bcc}
                                    onChange={(e) => setBcc(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {/* Subject Field */}
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            placeholder="Email subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    {/* Template Selection */}
                    {templates && templates.length > 0 && (
                        <div className="space-y-2">
                            <Label>Insert Template</Label>
                            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((template: any) => (
                                        <SelectItem key={template.id} value={template.id}>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                {template.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Body Field */}
                    <div className="space-y-2">
                        <Label htmlFor="body">Message *</Label>
                        <Textarea
                            id="body"
                            placeholder="Write your message here..."
                            rows={10}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    {/* Related To Info */}
                    {(leadId || customerId || tenderId || invoiceId) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            <span>Related to:</span>
                            {leadId && <span className="font-medium">Lead</span>}
                            {customerId && <span className="font-medium">Customer</span>}
                            {tenderId && <span className="font-medium">Tender</span>}
                            {invoiceId && <span className="font-medium">Invoice</span>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t pt-4 flex items-center justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sendEmailMutation.isPending || !toEmail || !subject || !body}
                        className="gap-2"
                    >
                        {sendEmailMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        {sendEmailMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
