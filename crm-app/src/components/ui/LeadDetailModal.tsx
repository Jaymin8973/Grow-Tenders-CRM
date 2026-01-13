'use client';

import { useState } from 'react';
import { Modal, Button, Badge, Avatar } from '@/components/ui';
import { Phone, Mail, Building2, User, Calendar, DollarSign, Tag, MessageSquare } from 'lucide-react';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: any;
}

const statusConfig: any = {
    new: { label: 'New', variant: 'info' },
    contacted: { label: 'Contacted', variant: 'warning' },
    qualified: { label: 'Qualified', variant: 'success' },
    unqualified: { label: 'Unqualified', variant: 'error' },
    proposal: { label: 'Proposal', variant: 'primary' },
    negotiation: { label: 'Negotiation', variant: 'secondary' },
    closed_won: { label: 'Won', variant: 'success' },
    closed_lost: { label: 'Lost', variant: 'error' },
};

const leadTypeColors: any = {
    hot: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    warm: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
};

export function LeadDetailModal({ isOpen, onClose, lead }: LeadDetailModalProps) {
    if (!lead) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Lead Details"
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <Button onClick={() => window.location.href = `mailto:${lead.email}`}>
                        <Mail size={16} /> Contact Lead
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <Avatar name={`${lead.firstName} ${lead.lastName}`} size="lg" />
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {lead.firstName} {lead.lastName}
                        </h2>
                        {lead.company && (
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Building2 size={14} />
                                {lead.company}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant={statusConfig[lead.status]?.variant || 'neutral'}>
                                {statusConfig[lead.status]?.label || lead.status}
                            </Badge>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium uppercase",
                                leadTypeColors[lead.leadType] || 'bg-gray-100 text-gray-600'
                            )}>
                                {lead.leadType}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                            {lead.score || 0}
                        </div>
                        <div className="text-xs text-gray-500">Lead Score</div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                            <Mail size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{lead.email}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                            <Phone size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Phone</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{lead.phone || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                            <Tag size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Source</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">{lead.source || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                            <DollarSign size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Expected Value</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {lead.expectedValue ? formatCurrency(lead.expectedValue) : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignment & Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Assigned To</div>
                        {lead.assignedTo ? (
                            <div className="flex items-center gap-2">
                                <Avatar name={`${lead.assignedTo.firstName || ''} ${lead.assignedTo.lastName || ''}`} size="sm" />
                                <span className="text-sm font-medium">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-gray-400 italic">Unassigned</span>
                        )}
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Created</div>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-sm">{formatDate(lead.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {lead.notes && (
                    <div>
                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <MessageSquare size={14} />
                            Notes
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                            {lead.notes}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
