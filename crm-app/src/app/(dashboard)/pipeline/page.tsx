'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, GripVertical, Loader2, RefreshCcw } from 'lucide-react';
import { Button, Card, Avatar, Badge, Modal, Input } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';

interface Deal {
    id: string;
    title: string;
    company: string;
    value: number;
    owner: string;
    expectedClose: string;
    probability: number;
    stageId: string;
}

interface Stage {
    id: string;
    name: string;
    color: string;
    deals: Deal[];
}

export default function PipelinePage() {
    const { user } = useAuth();
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);

    const fetchPipeline = async () => {
        try {
            setLoading(true);
            const response = await api.getDealsByStage();
            setStages(response.stages || []);
        } catch (error) {
            console.error('Failed to fetch pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPipeline();
        }
    }, [user]);

    const handleDragStart = (deal: Deal) => {
        setDraggedDeal(deal);
    };

    const handleDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        setDragOverStage(stageId);
    };

    const handleDragLeave = () => {
        setDragOverStage(null);
    };

    const handleDrop = async (targetStageId: string) => {
        if (!draggedDeal || draggedDeal.stageId === targetStageId) {
            setDraggedDeal(null);
            setDragOverStage(null);
            return;
        }

        try {
            await api.updateDeal(draggedDeal.id, { stage: targetStageId });
            fetchPipeline(); // Refresh data
        } catch (error) {
            console.error('Failed to update deal stage:', error);
        }

        setDraggedDeal(null);
        setDragOverStage(null);
    };

    const totalPipelineValue = stages.reduce(
        (sum, stage) => sum + stage.deals.reduce((stageSum, deal) => stageSum + deal.value, 0),
        0
    );

    const totalDeals = stages.reduce((sum, stage) => sum + stage.deals.length, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading pipeline...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Sales Pipeline
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {totalDeals} deals · {formatCurrency(totalPipelineValue)} total value
                        {user?.branchName && ` · ${user.branchName}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={fetchPipeline} title="Refresh">
                        <RefreshCcw size={18} />
                    </Button>
                    <Button>
                        <Plus size={18} />
                        Add Deal
                    </Button>
                </div>
            </div>

            {/* Pipeline Summary */}
            <div className="flex gap-4 overflow-x-auto pb-2">
                {stages.map((stage) => {
                    const stageValue = stage.deals.reduce((sum, deal) => sum + deal.value, 0);
                    return (
                        <div
                            key={stage.id}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg flex-shrink-0"
                            style={{
                                background: 'var(--background-card)',
                                border: '1px solid var(--border-color)',
                            }}
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ background: stage.color }}
                            />
                            <div>
                                <div className="text-sm font-medium">{stage.name}</div>
                                <div className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                                    {stage.deals.length} deals · {formatCurrency(stageValue)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Kanban Board */}
            <div className="kanban-board">
                {stages.map((stage) => (
                    <div
                        key={stage.id}
                        className="kanban-column"
                        onDragOver={(e) => handleDragOver(e, stage.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop(stage.id)}
                        style={{
                            background:
                                dragOverStage === stage.id
                                    ? 'var(--primary-50)'
                                    : 'var(--gray-50)',
                        }}
                    >
                        {/* Column Header */}
                        <div className="kanban-column-header">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: stage.color }}
                                />
                                <span className="kanban-column-title">{stage.name}</span>
                                <span className="kanban-column-count">{stage.deals.length}</span>
                            </div>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal size={16} />
                            </Button>
                        </div>

                        {/* Cards */}
                        <div className="kanban-cards">
                            {stage.deals.map((deal) => (
                                <div
                                    key={deal.id}
                                    className="kanban-card"
                                    draggable
                                    onDragStart={() => handleDragStart(deal)}
                                    style={{
                                        opacity: draggedDeal?.id === deal.id ? 0.5 : 1,
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <GripVertical
                                            size={16}
                                            style={{ color: 'var(--foreground-muted)', cursor: 'grab' }}
                                        />
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal size={14} />
                                        </Button>
                                    </div>
                                    <div className="kanban-card-title">{deal.title}</div>
                                    <div className="text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
                                        {deal.company}
                                    </div>
                                    <div className="kanban-card-value">{formatCurrency(deal.value)}</div>
                                    <div className="kanban-card-meta">
                                        <div className="flex items-center gap-2">
                                            <Avatar name={deal.owner} size="sm" />
                                            <span>{deal.owner.split(' ')[0]}</span>
                                        </div>
                                        <Badge
                                            variant={
                                                deal.probability >= 80
                                                    ? 'success'
                                                    : deal.probability >= 50
                                                        ? 'warning'
                                                        : 'neutral'
                                            }
                                        >
                                            {deal.probability}%
                                        </Badge>
                                    </div>
                                </div>
                            ))}

                            {stage.deals.length === 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No deals in this stage
                                </div>
                            )}

                            {/* Add Card Button */}
                            <button
                                className="w-full p-3 rounded-lg border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 hover:bg-white transition-colors"
                                style={{
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--foreground-muted)',
                                }}
                            >
                                <Plus size={16} />
                                Add Deal
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
