'use client';

import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
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
    X,
    Minus,
    Paperclip,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Link as LinkIcon,
    Type,
    MoreHorizontal,
    Mail,
    ChevronDown,
    XCircle,
    FileText,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';

interface ComposeEmailDialogProps {
    children?: React.ReactNode;
    defaultTo?: string;
    defaultSubject?: string;
    relatedTo?: { type: 'Lead' | 'Customer', id: string, name: string };
    isOpen?: boolean;
    onClose?: () => void;
}

export function ComposeEmailDialog({
    children,
    defaultTo = '',
    defaultSubject = '',
    relatedTo,
    isOpen: controlledOpen,
    onClose
}: ComposeEmailDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = (val: boolean) => {
        if (isControlled && onClose) {
            if (!val) onClose();
        } else {
            setInternalOpen(val);
        }
    };

    const { toast } = useToast();
    const [to, setTo] = useState(defaultTo);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState(defaultSubject);
    const [body, setBody] = useState('');
    const [ccEnabled, setCcEnabled] = useState(false);
    const [bccEnabled, setBccEnabled] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);

    // Reset/Sync state when dialog opens
    useEffect(() => {
        if (open) {
            setTo(defaultTo || '');
            if (defaultSubject) setSubject(defaultSubject);
        }
    }, [open, defaultTo, defaultSubject]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            UnderlineExtension,
            LinkExtension,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none',
            },
        },
        onUpdate: ({ editor }) => {
            setBody(editor.getHTML());
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const sendEmailMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.post('/email/send', data);
        },
        onSuccess: () => {
            toast({
                title: 'Email sent successfully',
                description: `Sent to ${to}.`,
                className: "bg-emerald-500 text-white border-0"
            });
            setOpen(false);
            setAttachments([]);
            editor?.commands.clearContent();
            setSubject('');
            setBody('');
            setCc('');
            setBcc('');
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to send email',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        }
    });

    const handleSend = () => {
        if (!to) {
            toast({
                title: 'Validation Error',
                description: 'Please add a recipient',
                variant: 'destructive',
            });
            return;
        }

        const payload: any = {
            to,
            cc: cc ? cc.split(',').map(e => e.trim()) : undefined,
            bcc: bcc ? bcc.split(',').map(e => e.trim()) : undefined,
            subject,
            body,
        };

        if (relatedTo) {
            if (relatedTo.type === 'Lead') payload.leadId = relatedTo.id;
            if (relatedTo.type === 'Customer') payload.customerId = relatedTo.id;
        }

        sendEmailMutation.mutate(payload);
    };

    const ToggleBtn = ({ isActive, onClick, icon: Icon }: any) => (
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", isActive && "bg-gray-200 text-black")}
            onClick={onClick}
        >
            <Icon className="h-3.5 w-3.5" />
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            {!isControlled && (
                <DialogTrigger asChild>
                    {children || (
                        <Button variant="outline" className="gap-2">
                            <Mail className="h-4 w-4" />
                            Compose Email
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent
                className="fixed bottom-0 right-16 p-0 gap-0 overflow-hidden borderx-0 shadow-2xl bg-white rounded-t-lg rounded-b-none flex flex-col sm:max-w-[600px] w-[600px] h-[600px] border border-gray-200 z-[100] translate-x-0 translate-y-0 top-auto left-auto data-[state=open]:slide-in-from-bottom-10 data-[state=open]:fade-in-0 transition-all duration-200 ease-in-out [&>button]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Custom Header */}
                <div className="bg-[#4a4a6a] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
                    <h2 className="text-base font-semibold tracking-wide">New Email</h2>
                    <div className="flex items-center gap-2">
                        <button className="hover:bg-white/10 p-1 rounded transition-colors text-white/80 hover:text-white">
                            <Minus className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setOpen(false)}
                            className="hover:bg-red-500/80 p-1 rounded transition-colors text-white/80 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Toolbar / Fields */}
                <div className="flex-1 overflow-y-auto bg-[#f8f9fa] p-4 space-y-3">
                    {/* FROM */}
                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right mr-2">From</Label>
                        <Select defaultValue="me">
                            <SelectTrigger className="h-9 bg-white border-gray-200">
                                <SelectValue placeholder="Select sender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="me">sarthak@growtenders.com (Me)</SelectItem>
                                <SelectItem value="sales">sales@growtenders.com</SelectItem>
                                <SelectItem value="support">support@growtenders.com</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* TO */}
                    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right mr-2">To</Label>
                        <div className="relative">
                            <Input
                                className="h-9 bg-white border-gray-200"
                                placeholder="Recipient email..."
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 text-sm text-gray-500 font-medium px-2">
                            <button onClick={() => setCcEnabled(!ccEnabled)} className={cn("hover:text-primary", ccEnabled && "text-primary")}>Cc</button>
                            <button onClick={() => setBccEnabled(!bccEnabled)} className={cn("hover:text-primary", bccEnabled && "text-primary")}>Bcc</button>
                        </div>
                    </div>

                    {/* CC */}
                    {ccEnabled && (
                        <div className="grid grid-cols-[80px_1fr] items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right mr-2">Cc</Label>
                            <Input
                                className="h-9 bg-white border-gray-200"
                                placeholder="Cc recipients..."
                                value={cc}
                                onChange={(e) => setCc(e.target.value)}
                            />
                        </div>
                    )}

                    {/* BCC */}
                    {bccEnabled && (
                        <div className="grid grid-cols-[80px_1fr] items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right mr-2">Bcc</Label>
                            <Input
                                className="h-9 bg-white border-gray-200"
                                placeholder="Bcc recipients..."
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                            />
                        </div>
                    )}

                    {/* SUBJECT */}
                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right mr-2">Subject</Label>
                        <Input
                            className="h-9 bg-white border-gray-200"
                            placeholder="Enter subject here..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    {/* Editor Toolbar */}
                    <div className="mt-4 border rounded-lg bg-white shadow-sm flex flex-col h-[400px]">
                        <div className="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                multiple
                                onChange={handleFileSelect}
                            />
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-gray-600" onClick={() => document.getElementById('file-upload')?.click()}>
                                <Paperclip className="h-4 w-4" />
                                <span className="text-xs">Attach</span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                            <div className="w-px h-5 bg-gray-300 mx-2" />

                            <ToggleBtn
                                isActive={editor?.isActive('bold')}
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                icon={Bold}
                            />
                            <ToggleBtn
                                isActive={editor?.isActive('italic')}
                                onClick={() => editor?.chain().focus().toggleItalic().run()}
                                icon={Italic}
                            />
                            <ToggleBtn
                                isActive={editor?.isActive('underline')}
                                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                                icon={Underline}
                            />
                            <ToggleBtn
                                isActive={editor?.isActive('strike')}
                                onClick={() => editor?.chain().focus().toggleStrike().run()}
                                icon={Strikethrough}
                            />

                            <div className="w-px h-5 bg-gray-300 mx-2" />

                            <ToggleBtn
                                isActive={editor?.isActive({ textAlign: 'left' })}
                                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                                icon={AlignLeft}
                            />
                            <ToggleBtn
                                isActive={editor?.isActive({ textAlign: 'center' })}
                                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                                icon={AlignCenter}
                            />
                            <ToggleBtn
                                isActive={editor?.isActive({ textAlign: 'right' })}
                                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                                icon={AlignRight}
                            />

                            <div className="w-px h-5 bg-gray-300 mx-2" />

                            <ToggleBtn
                                isActive={editor?.isActive('bulletList')}
                                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                icon={List}
                            />
                            <ToggleBtn
                                isActive={editor?.isActive('orderedList')}
                                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                icon={ListOrdered}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 cursor-text" onClick={() => editor?.chain().focus().run()}>
                            <EditorContent editor={editor} className="min-h-full outline-none prose prose-sm max-w-none" />
                        </div>

                        {/* Attachments List */}
                        {attachments.length > 0 && (
                            <div className="p-3 border-t bg-gray-50 flex flex-wrap gap-2">
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-white border px-3 py-1 rounded-full text-sm shadow-sm">
                                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                                        <span className="max-w-[150px] truncate">{file.name}</span>
                                        <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500">
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 bg-white border-t flex flex-col gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0 w-[80px] text-right mr-2">Related To</Label>
                        <div className="flex flex-1 items-center gap-2">
                            <Select defaultValue={relatedTo?.type || "Lead"}>
                                <SelectTrigger className="w-[120px] h-8 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Lead">Lead</SelectItem>
                                    <SelectItem value="Customer">Customer</SelectItem>
                                    <SelectItem value="Deal">Deal</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    className="h-8 text-sm"
                                    defaultValue={relatedTo?.name || ""}
                                    placeholder="Search record..."
                                />
                                {relatedTo?.name && (
                                    <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                                        <XCircle className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-dashed">
                        <Button variant="outline" className="text-gray-600 gap-2 border-gray-300 hover:bg-gray-50">
                            <FileText className="h-4 w-4" />
                            Insert Template
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={sendEmailMutation.isPending}
                            className="bg-[#4a4a6a] hover:bg-[#3b3b54] text-white min-w-[100px] gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            {sendEmailMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Send
                                    <Mail className="h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
