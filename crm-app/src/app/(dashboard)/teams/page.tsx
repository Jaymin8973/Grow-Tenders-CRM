'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    MoreHorizontal,
    Search,
    UserMinus,
    UserPlus,
    Shield,
} from 'lucide-react';
import { Button, Card, Avatar, Badge, Modal, Input } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function TeamsPage() {
    const { user, hasRole } = useAuth();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    const fetchTeams = async () => {
        try {
            setLoading(true);
            // In a real app, we would fetch teams here. 
            // For now, we'll try to fetch from API, if fails (backend not ready), fallback to partial UI or error.
            const response = await api.getTeams();
            setTeams(response.teams);
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableEmployees = async () => {
        try {
            const response = await api.getAvailableEmployees();
            setAvailableEmployees(response.employees);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTeams();
        }
    }, [user]);

    const handleAddMember = async () => {
        if (!selectedTeamId || !selectedEmployeeId) return;
        try {
            await api.addTeamMember(selectedTeamId, selectedEmployeeId);
            setIsAddMemberModalOpen(false);
            fetchTeams(); // Refresh list
            setSelectedEmployeeId('');
        } catch (error) {
            console.error('Failed to add member:', error);
            alert('Failed to add member');
        }
    };

    const handleRemoveMember = async (teamId: string, userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.removeTeamMember(teamId, userId);
            fetchTeams();
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Failed to remove member');
        }
    };

    const openAddMemberModal = (teamId: string) => {
        setSelectedTeamId(teamId);
        fetchAvailableEmployees();
        setIsAddMemberModalOpen(true);
    };

    if (!hasRole(['super_admin', 'manager'])) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="p-8 text-center max-w-md">
                    <Shield size={48} className="mx-auto mb-4 text-red-500" />
                    <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Access Restricted</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Only Managers and Super Admins can access team management.
                    </p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center">Loading teams...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={24} />
                        Team Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage your sales team and members
                    </p>
                </div>
                {hasRole('super_admin') && (
                    <Button>
                        <Plus size={18} />
                        Create Team
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {teams.map((team) => (
                    <Card key={team._id} className="overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{team.name}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Branch: {team.branchName} • Manager: {team.managerId?.firstName} {team.managerId?.lastName}
                                    </p>
                                </div>
                                <Button variant="secondary" size="sm" onClick={() => openAddMemberModal(team._id)}>
                                    <UserPlus size={16} />
                                    Add Member
                                </Button>
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="p-0">
                            {/* We need to fetch members for each team or if backend returned them. 
                                The current backend `getTeams` endpoint returns memberCount. 
                                We should probably fetch details or assume we iterate if we populate.
                                Actually `getTeams` in backend controller only populates manager.
                                Let's use `getTeamMembers` if we want to show list, or maybe we expand `getTeams` 
                                to include members? simpler for now: separate request or just expand.
                                
                                Wait, I implemented `getTeams` to return `teams` array.
                                Let's fetch members when expanding, OR for now, just show counts
                                and have a "View Members" or simpler: Just fetch all members for the team if I am manager.
                            */}

                            <TeamMembersList teamId={team._id} />
                        </div>
                    </Card>
                ))}

                {teams.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No teams found. {user?.role === 'manager' ? 'You haven\'t been assigned a team yet.' : ''}
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            <Modal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                title="Add Team Member"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAddMemberModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMember} disabled={!selectedEmployeeId}>Add Member</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Select an employee to add to this team. Only employees from your branch who are not already in a team are listed.
                    </p>

                    {availableEmployees.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {availableEmployees.map(emp => (
                                <label key={emp._id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <input
                                        type="radio"
                                        name="employee"
                                        value={emp._id}
                                        checked={selectedEmployeeId === emp._id}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        className="accent-primary-600"
                                    />
                                    <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</div>
                                        <div className="text-xs text-gray-500">{emp.email}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-500">
                            No available employees found in your branch.
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

function TeamMembersList({ teamId }: { teamId: string }) {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMembers = async () => {
        try {
            const data = await api.getTeamMembers(teamId);
            setMembers(data.members);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, [teamId]);

    const handleRemove = async (userId: string) => {
        if (!confirm('Remove this member?')) return;
        try {
            await api.removeTeamMember(teamId, userId);
            loadMembers();
        } catch (e) {
            alert('Error removing member');
        }
    };

    if (loading) return <div className="p-6 text-sm text-gray-500">Loading members...</div>;

    if (members.length === 0) return <div className="p-6 text-sm text-gray-500">No members in this team yet.</div>;

    return (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {members.map((member) => (
                <div key={member._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <Avatar name={`${member.firstName} ${member.lastName}`} />
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                                {member.firstName} {member.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {member.email}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-gray-500">Joined</div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatDate(member.createdAt)}</div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleRemove(member._id)}
                            title="Remove from team"
                        >
                            <UserMinus size={16} />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
