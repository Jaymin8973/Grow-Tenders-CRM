'use client';

import { useState } from 'react';
import {
    Mail,
    Inbox,
    Send,
    File,
    Trash2,
    Star,
    AlertCircle,
    Search,
    Plus,
    MoreVertical,
    Reply,
    Forward,
    Paperclip,
    X,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
import { Button, Card, Input, Avatar, Badge, Modal } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { formatDate, cn } from '@/lib/utils';

interface Email {
    id: string;
    from: {
        name: string;
        email: string;
        avatar?: string;
    };
    to: string[];
    subject: string;
    preview: string;
    content: string;
    date: string;
    read: boolean;
    starred: boolean;
    labels: ('work' | 'personal' | 'important')[];
    folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam';
    attachments?: { name: string; size: string; type: string }[];
}

const mockEmails: Email[] = [
    {
        id: '1',
        from: { name: 'Sarah Johnson', email: 'sarah@client.com' },
        to: ['me@company.com'],
        subject: 'Project Proposal Review',
        preview: 'Hi there, I have reviewed the proposal and I have a few questions regarding the timeline...',
        content: 'Hi there,\n\nI have reviewed the proposal and I have a few questions regarding the timeline and budget allocation for Q3. Can we schedule a call to discuss this further?\n\nBest regards,\nSarah',
        date: '2024-01-11T09:30:00',
        read: false,
        starred: true,
        labels: ['work', 'important'],
        folder: 'inbox',
    },
    {
        id: '2',
        from: { name: 'Michael Chen', email: 'michael@partner.com' },
        to: ['me@company.com'],
        subject: 'Partnership Opportunity',
        preview: 'Hello, I represent TechFlow and we are interested in exploring potential synergies...',
        content: 'Hello,\n\nI represent TechFlow and we are interested in exploring potential synergies between our platforms. Would you be open to a preliminary meeting next week?\n\nRegards,\nMichael',
        date: '2024-01-10T14:15:00',
        read: true,
        starred: false,
        labels: ['work'],
        folder: 'inbox',
    },
    {
        id: '3',
        from: { name: 'Support Team', email: 'support@saas.com' },
        to: ['me@company.com'],
        subject: 'Your ticket #4582 has been updated',
        preview: 'Dear user, your support ticket regarding the API integration has been resolved...',
        content: 'Dear user,\n\nYour support ticket regarding the API integration has been resolved. Please check the dashboard for details.\n\nBest,\nSupport Team',
        date: '2024-01-09T11:20:00',
        read: true,
        starred: false,
        labels: [],
        folder: 'inbox',
    },
    {
        id: '4',
        from: { name: 'John Smith', email: 'john@company.com' },
        to: ['client@bigco.com'],
        subject: 'Meeting Follow-up',
        preview: 'Thanks for your time today. As discussed, here are the next steps...',
        content: 'Thanks for your time today. As discussed, here are the next steps:\n\n1. Sign NDA\n2. Share accessing credentials\n3. Kickoff meeting\n\nLet me know if you have questions.\n\nJohn',
        date: '2024-01-08T16:45:00',
        read: true,
        starred: false,
        labels: ['work'],
        folder: 'sent',
        attachments: [{ name: 'presentation.pdf', size: '2.4 MB', type: 'pdf' }],
    },
];

const labelsConfig = {
    work: { color: 'var(--info-500)', bg: 'var(--info-50)' },
    personal: { color: 'var(--success-500)', bg: 'var(--success-50)' },
    important: { color: 'var(--warning-500)', bg: 'var(--warning-50)' },
};

export default function EmailPage() {
    const { user } = useAuth();
    const [emails, setEmails] = useState<Email[]>(mockEmails);
    const [selectedFolder, setSelectedFolder] = useState<Email['folder']>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // Filter emails
    const filteredEmails = emails.filter((email) => {
        const inFolder = email.folder === selectedFolder;
        const matchesSearch =
            email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.content.toLowerCase().includes(searchQuery.toLowerCase());
        return inFolder && matchesSearch;
    });

    const unreadCount = emails.filter((e) => e.folder === 'inbox' && !e.read).length;

    const handleEmailClick = (email: Email) => {
        setSelectedEmail(email);
        if (!email.read) {
            setEmails((prev) =>
                prev.map((e) => (e.id === email.id ? { ...e, read: true } : e))
            );
        }
    };

    const toggleStar = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setEmails((prev) =>
            prev.map((email) =>
                email.id === id ? { ...email, starred: !email.starred } : email
            )
        );
    };

    const deleteEmail = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setEmails((prev) =>
            prev.map((email) =>
                email.id === id ? { ...email, folder: 'trash' } : email
            )
        );
        if (selectedEmail?.id === id) setSelectedEmail(null);
    };

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6">
            {/* Sidebar */}
            <Card className="w-64 flex flex-col p-4 flex-shrink-0">
                <Button className="w-full mb-6" onClick={() => setIsComposeOpen(true)}>
                    <Plus size={18} />
                    Compose
                </Button>

                <nav className="space-y-1 flex-1">
                    {[
                        { id: 'inbox', label: 'Inbox', icon: Inbox, count: unreadCount },
                        { id: 'sent', label: 'Sent', icon: Send },
                        { id: 'drafts', label: 'Drafts', icon: File },
                        { id: 'starred', label: 'Starred', icon: Star },
                        { id: 'trash', label: 'Trash', icon: Trash2 },
                        { id: 'spam', label: 'Spam', icon: AlertCircle },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = selectedFolder === item.id || (item.id === 'starred' && selectedFolder === 'inbox' && false); // Simplified logic

                        // Handle special folders like starred which are filters, not folders in this simple model
                        // For now, let's just use folder matching

                        return (
                            <button
                                key={item.id}
                                onClick={() => setSelectedFolder(item.id as any)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    selectedFolder === item.id
                                        ? "bg-primary-50 text-primary-600"
                                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={18} />
                                    {item.label}
                                </div>
                                {item.count && item.count > 0 && (
                                    <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                        Labels
                    </h3>
                    <div className="space-y-1">
                        {Object.entries(labelsConfig).map(([key, config]) => (
                            <button
                                key={key}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: config.color }}
                                />
                                <span className="capitalize">{key}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Email List */}
            <Card className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search emails..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <RefreshCw size={18} />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <MoreVertical size={18} />
                        </Button>
                        <div className="flex items-center gap-1 border-l pl-2 ml-2 border-gray-200 dark:border-gray-800">
                            <span className="text-sm text-gray-500">1-50 of 1,245</span>
                            <Button variant="ghost" size="icon" disabled>
                                <ChevronLeft size={18} />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <ChevronRight size={18} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex flex-1 overflow-hidden">
                    {selectedEmail ? (
                        // Email Detail View
                        <div className="flex-1 flex flex-col h-full overflow-y-auto">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)}>
                                        <ChevronLeft size={18} />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Delete">
                                        <Trash2 size={18} />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Mark as unread">
                                        <Mail size={18} />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Star">
                                        <Star
                                            size={18}
                                            fill={selectedEmail.starred ? "currentColor" : "none"}
                                            className={selectedEmail.starred ? "text-yellow-400" : ""}
                                        />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">
                                        {formatDate(selectedEmail.date)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <h2 className="text-2xl font-bold mb-6">{selectedEmail.subject}</h2>

                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={selectedEmail.from.name} />
                                        <div>
                                            <div className="font-semibold text-sm">
                                                {selectedEmail.from.name}
                                                <span className="text-gray-500 font-normal ml-2">
                                                    &lt;{selectedEmail.from.email}&gt;
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                to {selectedEmail.to.join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm">
                                            <Reply size={16} /> Reply
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Forward size={16} /> Forward
                                        </Button>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mb-8">
                                    {selectedEmail.content}
                                </div>

                                {selectedEmail.attachments && (
                                    <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <Paperclip size={16} />
                                            {selectedEmail.attachments.length} Attachments
                                        </h4>
                                        <div className="flex gap-4">
                                            {selectedEmail.attachments.map((file, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                                >
                                                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded flex items-center justify-center">
                                                        <File size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">{file.name}</div>
                                                        <div className="text-xs text-gray-500">{file.size}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Reply size={16} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-500">Reply to {selectedEmail.from.name}</span>
                                        </div>
                                        <textarea
                                            className="w-full bg-transparent border-none outline-none resize-none min-h-[100px]"
                                            placeholder="Write your reply..."
                                        ></textarea>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex gap-2 text-gray-400">
                                                <Paperclip size={18} className="cursor-pointer hover:text-gray-600" />
                                            </div>
                                            <Button size="sm">Send Reply</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // List View
                        <div className="flex-1 overflow-y-auto">
                            {filteredEmails.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <Inbox size={48} className="mb-4 opacity-50" />
                                    <p>No emails found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {filteredEmails.map((email) => (
                                        <div
                                            key={email.id}
                                            onClick={() => handleEmailClick(email)}
                                            className={cn(
                                                "group flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                                                !email.read && "bg-gray-50 dark:bg-gray-800/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => toggleStar(e, email.id)}
                                                    className={cn(
                                                        "opacity-0 group-hover:opacity-100 transition-opacity",
                                                        email.starred ? "text-yellow-400 opacity-100" : "text-gray-400"
                                                    )}
                                                >
                                                    <Star size={18} fill={email.starred ? "currentColor" : "none"} />
                                                </button>
                                                <Avatar name={email.from.name} size="sm" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={cn("text-sm transition-colors", !email.read ? "font-bold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-300")}>
                                                        {email.from.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 group-hover:hidden">
                                                        {formatDate(email.date)}
                                                    </span>
                                                    <div className="hidden group-hover:flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => deleteEmail(e, email.id)}
                                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500">
                                                            <Mail size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                                                    <span className={cn(!email.read && "font-semibold text-gray-900 dark:text-white mr-2")}>
                                                        {email.subject}
                                                    </span>
                                                    <span className="text-gray-500">- {email.preview}</span>
                                                </div>
                                                {email.labels.length > 0 && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {email.labels.map((label) => (
                                                            <Badge
                                                                key={label}
                                                                variant="neutral"
                                                                className="text-[10px] px-1.5 py-0 h-4"
                                                                style={{
                                                                    background: labelsConfig[label].bg,
                                                                    color: labelsConfig[label].color,
                                                                }}
                                                            >
                                                                {label}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Compose Modal */}
            <Modal
                isOpen={isComposeOpen}
                onClose={() => setIsComposeOpen(false)}
                title="New Message"
                size="lg"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                                <Paperclip size={18} />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <File size={18} />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => setIsComposeOpen(false)}>
                                Discard
                            </Button>
                            <Button onClick={() => setIsComposeOpen(false)}>
                                Send Message <Send size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    <Input label="To" placeholder="recipient@email.com" />
                    <Input label="Subject" placeholder="Email subject" />
                    <div className="h-64 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <textarea
                            className="w-full h-full bg-transparent border-none outline-none resize-none"
                            placeholder="Write your message here..."
                        ></textarea>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
