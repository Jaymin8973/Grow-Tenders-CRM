'use client';

import { useState } from 'react';
import {
    Bell,
    Search,
    Filter,
    MapPin,
    Calendar,
    Briefcase,
    Star,
    CheckCircle,
    ExternalLink,
    Info,
    ChevronDown,
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface Tender {
    id: string;
    title: string;
    authority: string;
    location: string;
    deadline: string;
    value: number;
    sector: string;
    status: 'active' | 'closing_soon' | 'closed';
    matchScore: number;
    subscribed: boolean;
}

const mockTenders: Tender[] = [
    {
        id: '1',
        title: 'Supply of IT Equipment and Software Licenses',
        authority: 'Department of Education',
        location: 'New York, NY',
        deadline: '2024-02-15',
        value: 500000,
        sector: 'Technology',
        status: 'active',
        matchScore: 95,
        subscribed: true,
    },
    {
        id: '2',
        title: 'Digital Transformation Consulting Services',
        authority: 'City Council',
        location: 'Chicago, IL',
        deadline: '2024-02-01',
        value: 120000,
        sector: 'Consulting',
        status: 'closing_soon',
        matchScore: 88,
        subscribed: false,
    },
    {
        id: '3',
        title: 'Maintenance of CRM Systems',
        authority: 'Health Authority',
        location: 'Los Angeles, CA',
        deadline: '2024-03-10',
        value: 350000,
        sector: 'Technology',
        status: 'active',
        matchScore: 92,
        subscribed: false,
    },
    {
        id: '4',
        title: 'Network Infrastructure Upgrade',
        authority: 'Transport Dept',
        location: 'Houston, TX',
        deadline: '2024-01-20',
        value: 850000,
        sector: 'Telecom',
        status: 'closing_soon',
        matchScore: 75,
        subscribed: true,
    },
    {
        id: '5',
        title: 'Cloud Migration Services',
        authority: 'State Government',
        location: 'Austin, TX',
        deadline: '2024-04-01',
        value: 1500000,
        sector: 'Technology',
        status: 'active',
        matchScore: 60,
        subscribed: false,
    },
];

export default function TendersPage() {
    const { user } = useAuth();
    const [tenders, setTenders] = useState<Tender[]>(mockTenders);
    const [filter, setFilter] = useState<'all' | 'subscribed' | 'matched'>('all');
    const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

    const toggleSubscription = (id: string) => {
        setTenders(prev => prev.map(t => t.id === id ? { ...t, subscribed: !t.subscribed } : t));
    };

    const filteredTenders = tenders.filter(t => {
        if (filter === 'subscribed') return t.subscribed;
        if (filter === 'matched') return t.matchScore >= 80;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tender Opportunities</h1>
                    <p className="text-gray-500 dark:text-gray-400">Find and subscribe to relevant business opportunities</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary">
                        <Bell size={18} />
                        Alert Settings
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            {[
                                { id: 'all', label: 'All Opportunities' },
                                { id: 'subscribed', label: 'My Subscriptions' },
                                { id: 'matched', label: 'Best Matches' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFilter(opt.id as any)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                                        filter === opt.id
                                            ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                                            : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by keyword, authority, or location..."
                            className="pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-none rounded-lg outline-none w-full"
                        />
                    </div>
                </div>
            </Card>

            {/* Tenders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenders.map(tender => (
                    <Card key={tender.id} className={cn(
                        "flex flex-col h-full border-t-4",
                        tender.matchScore >= 90 ? "border-t-green-500" :
                            tender.matchScore >= 70 ? "border-t-blue-500" : "border-t-gray-300"
                    )}>
                        <div className="p-5 flex-1 pb-2">
                            <div className="flex justify-between items-start mb-3">
                                <Badge variant={tender.status === 'closing_soon' ? 'warning' : 'success'} className="mb-2">
                                    {tender.status === 'closing_soon' ? 'Closing Soon' : 'Active'}
                                </Badge>
                                {tender.matchScore >= 80 && (
                                    <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                        <Star size={12} fill="currentColor" />
                                        {tender.matchScore}% Match
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-2 line-clamp-2" title={tender.title}>{tender.title}</h3>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{tender.authority}</div>

                            <div className="space-y-2 text-sm text-gray-500 mb-4">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    {tender.location}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Briefcase size={14} />
                                    {tender.sector}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    Deadline: <span className={cn(tender.status === 'closing_soon' && "text-red-500 font-medium")}>{formatDate(tender.deadline)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 pb-5 pt-0 mt-auto">
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                                <div className="font-bold text-lg text-primary-600">
                                    {formatCurrency(tender.value)}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedTender(tender)}>
                                        Details
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={tender.subscribed ? "secondary" : "primary"}
                                        onClick={() => toggleSubscription(tender.id)}
                                    >
                                        {tender.subscribed ? "Subscribed" : "Subscribe"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Details Modal */}
            {selectedTender && (
                <Modal
                    isOpen={!!selectedTender}
                    onClose={() => setSelectedTender(null)}
                    title="Tender Details TR-4928"
                    size="lg"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setSelectedTender(null)}>Close</Button>
                            <Button onClick={() => window.open('#', '_blank')}>
                                View Official Doc <ExternalLink size={16} className="ml-2" />
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold mb-2">{selectedTender.title}</h2>
                                <div className="flex gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {selectedTender.location}</span>
                                    <span className="flex items-center gap-1"><Briefcase size={14} /> {selectedTender.sector}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-primary-600">{formatCurrency(selectedTender.value)}</div>
                                <div className="text-sm text-gray-500">Estimated Value</div>
                            </div>
                        </div>

                        <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Info size={18} className="text-primary-500" />
                                Summary
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                The {selectedTender.authority} is inviting proposals for the provision of {selectedTender.title.toLowerCase()}.
                                This is a significant opportunity for qualified vendors with experience in the {selectedTender.sector} sector.
                                The scope includes design, implementation, and support for a period of 3 years.
                            </p>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">Publish Date</span>
                                <span className="font-medium">Jan 10, 2024</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">Submission Deadline</span>
                                <span className="font-medium text-red-600">{formatDate(selectedTender.deadline)}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">Contact Person</span>
                                <span className="font-medium">Jane Doe (Procurement)</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block mb-1">Reference No</span>
                                <span className="font-medium">TR-2024-8842</span>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
