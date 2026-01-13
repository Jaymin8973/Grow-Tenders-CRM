'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Building2,
    Kanban,
    FileText,
    Mail,
    Receipt,
    BarChart3,
    Trophy,
    Settings,
    UserCog,
    ChevronLeft,
    ChevronRight,
    FileStack,
    Briefcase,
    CalendarCheck,
    FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers';
import type { Role } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    roles: Role[];
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navigation: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'manager', 'employee'] },
            { label: 'Leaderboard', href: '/leaderboard', icon: Trophy, roles: ['super_admin', 'manager', 'employee'] },
        ],
    },
    {
        label: 'Sales',
        items: [
            { label: 'Leads', href: '/leads', icon: Users, roles: ['super_admin', 'manager', 'employee'] },
            { label: 'Customers', href: '/customers', icon: Building2, roles: ['super_admin', 'manager', 'employee'] },
            { label: 'Pipeline', href: '/pipeline', icon: Kanban, roles: ['super_admin', 'manager', 'employee'] },
            { label: 'Deals', href: '/deals', icon: Briefcase, roles: ['super_admin', 'manager', 'employee'] },
            { label: 'Follow-ups', href: '/followups', icon: CalendarCheck, roles: ['super_admin', 'manager', 'employee'] },
        ],
    },
    {
        label: 'Communications',
        items: [
            { label: 'Emails', href: '/email', icon: Mail, roles: ['super_admin', 'manager', 'employee'] },
            { label: 'Tenders', href: '/tenders', icon: FileStack, roles: ['super_admin', 'manager'] },
            { label: 'Invoices', href: '/invoices', icon: Receipt, roles: ['super_admin', 'manager'] },
        ],
    },
    {
        label: 'Analytics',
        items: [
            { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['super_admin', 'manager', 'employee'] },
        ],
    },
    {
        label: 'Admin',
        items: [
            { label: 'Users', href: '/users', icon: UserCog, roles: ['super_admin'] },
            { label: 'Teams', href: '/teams', icon: FolderOpen, roles: ['super_admin'] },
            { label: 'Settings', href: '/settings', icon: Settings, roles: ['super_admin', 'manager', 'employee'] },
        ],
    },
];

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const { user } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by ensuring content only renders on client after mount
    if (!mounted) return null;
    if (!user) return null;

    const filteredNavigation = navigation
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => item.roles.includes(user.role)),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-[width] duration-300 ease-in-out",
                collapsed ? "w-[72px]" : "w-[260px]"
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                    <Image
                        src="/Grow-Tenders-Logo.jpg"
                        alt="Grow Tenders"
                        width={36}
                        height={36}
                        className="object-cover"
                    />
                </div>
                {!collapsed && (
                    <span className="font-semibold text-lg text-gray-900 dark:text-white whitespace-nowrap overflow-hidden">
                        Grow Tenders
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
                {filteredNavigation.map((group) => (
                    <div key={group.label} className="mb-6 px-3">
                        {!collapsed && (
                            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap transition-opacity duration-200">
                                {group.label}
                            </div>
                        )}
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                const Icon = item.icon;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                                                isActive
                                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                                            )}
                                        >
                                            <Icon size={20} className={cn("shrink-0 transition-colors", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300")} />

                                            <span className={cn(
                                                "whitespace-nowrap transition-opacity duration-200",
                                                collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                                            )}>
                                                {item.label}
                                            </span>

                                            {/* Tooltip for collapsed state */}
                                            {collapsed && (
                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                                    {item.label}
                                                </div>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={onToggle}
                className="flex items-center justify-center w-full h-12 border-t border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors shrink-0"
            >
                {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
        </aside>
    );
}
