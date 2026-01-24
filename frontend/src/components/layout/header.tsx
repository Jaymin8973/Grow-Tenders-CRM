'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Settings, User, LogOut, Moon, Sun } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/notification-center';

export function Header() {
    const { user, logout } = useAuth();
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 h-16 border-b bg-card/80 backdrop-blur-xl">
            <div className="flex h-full items-center justify-between px-6">
                {/* Left side - Search */}
                <div className="flex items-center gap-4">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search leads, customers, deals..."
                            className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <NotificationCenter />

                    {/* Settings */}
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                        <Settings className="h-5 w-5" />
                    </Button>

                    {/* Divider */}
                    <div className="hidden sm:block h-8 w-px bg-border mx-2" />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 gap-2 px-2">
                                <Avatar className="h-8 w-8 border border-border">
                                    <AvatarImage src={user?.avatar} alt={user?.firstName} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                        {user ? getInitials(user.firstName, user.lastName) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium leading-tight">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {user?.role?.toLowerCase().replace('_', ' ')}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
