'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Avatar } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/components/providers';

interface LeadAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId?: string;
    leadIds?: string[]; // For bulk assignment
    onAssign: () => void;
}

export function LeadAssignModal({ isOpen, onClose, leadId, leadIds, onAssign }: LeadAssignModalProps) {
    const { user } = useAuth();
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (isOpen && user?.teamId) {
            loadTeamMembers();
        }
    }, [isOpen, user]);

    const loadTeamMembers = async () => {
        if (!user?.teamId) return;
        try {
            setLoading(true);
            const data = await api.getTeamMembers(user.teamId);
            setMembers(data.members);
        } catch (error) {
            console.error('Failed to load team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedMemberId) return;

        try {
            setAssigning(true);

            if (leadIds && leadIds.length > 0) {
                // Bulk assign
                await api.bulkAssignLeads(leadIds, selectedMemberId);
            } else if (leadId) {
                // Single assign
                await api.assignLead(leadId, selectedMemberId);
            }

            onAssign();
            onClose();
        } catch (error) {
            console.error('Failed to assign lead:', error);
            alert('Failed to assign lead');
        } finally {
            setAssigning(false);
        }
    };

    const isBulk = leadIds && leadIds.length > 0;
    const title = isBulk ? `Assign ${leadIds.length} Leads` : 'Assign Lead';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={!selectedMemberId || assigning}>
                        {assigning ? 'Assigning...' : 'Assign'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Select a team member to assign {isBulk ? 'these leads' : 'this lead'} to.
                </p>

                {loading ? (
                    <div className="text-center py-4 text-sm text-gray-500">Loading members...</div>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                            <input
                                type="radio"
                                name="assignee"
                                value={user?.id}
                                checked={selectedMemberId === user?.id}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                className="accent-primary-600"
                            />
                            <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
                            <div className="text-sm font-medium">Me ({user?.firstName})</div>
                        </label>

                        {members.map(member => (
                            <label key={member._id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                <input
                                    type="radio"
                                    name="assignee"
                                    value={member._id}
                                    checked={selectedMemberId === member._id}
                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                    className="accent-primary-600"
                                />
                                <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{member.firstName} {member.lastName}</div>
                                    <div className="text-xs text-gray-500">{member.email}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
