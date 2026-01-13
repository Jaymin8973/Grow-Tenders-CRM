'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    Search,
    Sun,
    Moon,
    LogOut,
    User,
    Settings,
    ChevronDown,
    Menu,
} from 'lucide-react';
import { Button, Avatar } from '@/components/ui';
import { useAuth, useTheme } from '@/components/providers';
import { ROLE_LABELS } from '@/lib/utils';

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { resolvedTheme, setTheme } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    if (!user) return null;

    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 flex items-center justify-between px-6 shadow-sm transition-colors duration-200">
            {/* Left side */}
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu size={20} />
                </Button>

                {/* Search */}
                <div className="hidden md:block w-full max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search leads, customers, deals..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 transition-all"
                        />
                        <kbd className="hidden lg:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[10px] text-gray-400 font-sans shadow-sm">
                            ⌘K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                    {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </Button>

                {/* Notifications */}
                <div className="relative">
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                        <Bell size={20} />
                    </Button>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>

                {/* User Menu */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 pl-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                        <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" className="ring-2 ring-transparent group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900 transition-all" />
                        <div className="hidden md:block text-left">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {ROLE_LABELS[user.role]}
                            </div>
                        </div>
                        <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</div>
                                <div className="text-xs text-gray-500 truncate" title={user.email}>
                                    {user.email}
                                </div>
                            </div>

                            <div className="p-1">
                                <button
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    onClick={() => router.push('/settings/profile')}
                                >
                                    <User size={16} className="text-gray-400" />
                                    Profile
                                </button>
                                <button
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    onClick={() => router.push('/settings')}
                                >
                                    <Settings size={16} className="text-gray-400" />
                                    Settings
                                </button>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 p-1">
                                <button
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
