import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: number | string;
    change?: number;
    changeLabel?: string;
    icon?: ReactNode;
    iconBg?: string;
    format?: 'currency' | 'number' | 'none';
    className?: string;
}

export function StatCard({
    label,
    value,
    change,
    changeLabel,
    icon,
    iconBg,
    format = 'number',
    className,
}: StatCardProps) {
    const formattedValue =
        format === 'currency' && typeof value === 'number'
            ? formatCurrency(value)
            : format === 'number' && typeof value === 'number'
                ? formatNumber(value)
                : value;

    // Map iconBg variable to Tailwind classes
    const getIconBgClass = () => {
        if (!iconBg) return 'bg-primary-50 dark:bg-primary-900/20';
        if (iconBg.includes('info')) return 'bg-blue-50 dark:bg-blue-900/20';
        if (iconBg.includes('warning')) return 'bg-amber-50 dark:bg-amber-900/20';
        if (iconBg.includes('success')) return 'bg-green-50 dark:bg-green-900/20';
        if (iconBg.includes('error')) return 'bg-red-50 dark:bg-red-900/20';
        return 'bg-primary-50 dark:bg-primary-900/20';
    };

    const getIconColorClass = () => {
        if (!iconBg) return 'text-primary-600 dark:text-primary-400';
        if (iconBg.includes('info')) return 'text-blue-600 dark:text-blue-400';
        if (iconBg.includes('warning')) return 'text-amber-600 dark:text-amber-400';
        if (iconBg.includes('success')) return 'text-green-600 dark:text-green-400';
        if (iconBg.includes('error')) return 'text-red-600 dark:text-red-400';
        return 'text-primary-600 dark:text-primary-400';
    };

    return (
        <div className={cn(
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow',
            className
        )}>
            {icon && (
                <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                    getIconBgClass(),
                    getIconColorClass()
                )}>
                    {icon}
                </div>
            )}
            <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</span>
            <span className="block text-2xl font-bold text-gray-900 dark:text-white">{formattedValue}</span>
            {change !== undefined && (
                <span className={cn(
                    'flex items-center gap-1 text-xs mt-2',
                    change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                    {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {formatPercentage(change)} {changeLabel || 'vs last month'}
                </span>
            )}
        </div>
    );
}
