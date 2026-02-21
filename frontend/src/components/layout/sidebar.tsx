'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import {
    LayoutDashboard,
    Users,
    UserPlus,
    CalendarDays,
    Trophy,
    FileText,
    BarChart3,
    Building2,
    ChevronRight,
    LogOut,
    Wallet,
    FileSearch,
    Target,
    Phone,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Telecalling', href: '/telecalling', icon: Phone },
    { name: 'Leads', href: '/leads', icon: UserPlus },
    { name: 'Customers', href: '/customers', icon: Users },

    { name: 'Teams', href: '/teams', icon: Users, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Tasks', href: '/tasks', icon: FileText },
    { name: 'Daily Reports', href: '/daily-reports', icon: BarChart3 },
    { name: 'GeM Tenders', href: '/scraped-tenders', icon: FileSearch },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

const adminNav = [
    { name: 'Payments', href: '/payments', icon: Wallet, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Transfer Requests', href: '/leads/transfer-requests', icon: UserPlus, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Users', href: '/users', icon: Building2, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Targets', href: '/targets', icon: Target, roles: ['SUPER_ADMIN', 'MANAGER'] },
    { name: 'Scraper Logs', href: '/scraper-logs', icon: FileSearch, roles: ['SUPER_ADMIN'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const filteredAdminNav = adminNav.filter(
        (item) => user && item.roles.includes(user.role)
    );

    const NavLink = ({ item }: { item: typeof navigation[0] }) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const IconComponent = item.icon;

        return (
            <Link
                href={item.href}
                className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
            >
                <IconComponent className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    !isActive && 'group-hover:scale-110'
                )} />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                    <ChevronRight className="h-4 w-4 opacity-70" />
                )}
            </Link>
        );
    };

    return (
        <div className="flex h-full w-72 flex-col bg-card border-r">
            {/* Logo */}
            <div className="flex h-20 items-center gap-3 px-6 border-b">
                <div className="relative h-11 w-11 ">
                    <Image
                        src="/images/Logo-GT.png"
                        alt="Company Logo"
                        fill
                        className="object-cover"
                    />
                </div>
                <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-[#1a5f6c] to-[#e67e22] bg-clip-text text-transparent">
                        Grow Tender
                    </span>
                    <p className="text-xs text-muted-foreground">CRM Platform</p>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-1.5">
                    <div className="space-y-1.5">
                        {navigation.filter(item => !item.roles || (user && item.roles.includes(user.role))).map((item) => (
                            <NavLink key={item.name} item={item} />
                        ))}
                    </div>
                </div>

                {/* Admin Section */}
                {filteredAdminNav.length > 0 && (
                    <div className="mt-8">
                        <p className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Administration
                        </p>
                        <div className="space-y-1.5">
                            {filteredAdminNav.map((item) => (
                                <NavLink key={item.name} item={item} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* User Section */}
            <div className="border-t p-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Avatar className="h-10 w-10 border-2 border-white shadow">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                            {user ? getInitials(user.firstName, user.lastName) : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                            {user?.role?.toLowerCase().replace('_', ' ')}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
