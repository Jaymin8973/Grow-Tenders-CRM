'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import { User, Lock, Bell, Loader2, Shield } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // Profile form state
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    type ScreenKey =
        | 'today'
        | 'dashboard'
        | 'leads'
        | 'customers'
        | 'teams'
        | 'dailyReports'
        | 'scrapedTenders'
        | 'leaderboard'
        | 'payments'
        | 'invoices'
        | 'transferRequests'
        | 'users'
        | 'targets'
        | 'scraperLogs'
        | 'activities'
        | 'settings';

    type ScreenAccessMap = Record<ScreenKey, boolean>;

    type ScreenAccessBundle = {
        manager: { role: 'MANAGER'; screens: ScreenAccessMap };
        employee: { role: 'EMPLOYEE'; screens: ScreenAccessMap };
    };

    const screenList = useMemo<Array<{ key: ScreenKey; label: string }>>(
        () => [
            { key: 'today', label: 'Today' },
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'leads', label: 'Leads' },
            { key: 'customers', label: 'Customers' },
            { key: 'teams', label: 'Teams' },
            { key: 'dailyReports', label: 'Daily Reports' },
            { key: 'scrapedTenders', label: 'GeM Tenders' },
            { key: 'leaderboard', label: 'Leaderboard' },
            { key: 'inquiries', label: 'Inquiries' },
            { key: 'payments', label: 'Payments' },
            { key: 'invoices', label: 'Invoices' },
            { key: 'transferRequests', label: 'Transfer Requests' },
            { key: 'users', label: 'Users' },
            { key: 'targets', label: 'Targets' },
            { key: 'scraperLogs', label: 'Scraper Logs' },
            { key: 'activities', label: 'Activities' },
            { key: 'settings', label: 'Settings' },
        ],
        [],
    );

    const [screenBundle, setScreenBundle] = useState<ScreenAccessBundle | null>(null);
    const [isScreenLoading, setIsScreenLoading] = useState(false);

    useEffect(() => {
        if (!isSuperAdmin) return;
        setIsScreenLoading(true);
        apiClient
            .get('/permissions/screen-access')
            .then((res) => setScreenBundle(res.data))
            .catch((err: any) => {
                toast({
                    title: 'Error',
                    description: err.response?.data?.message || 'Failed to load screen access',
                    variant: 'destructive',
                });
            })
            .finally(() => setIsScreenLoading(false));
    }, [isSuperAdmin, toast]);

    const toggleRoleScreen = (role: 'MANAGER' | 'EMPLOYEE', key: ScreenKey) => {
        setScreenBundle((prev) => {
            if (!prev) return prev;
            const current = role === 'MANAGER' ? prev.manager.screens : prev.employee.screens;
            const nextScreens = { ...current, [key]: !current[key] } as ScreenAccessMap;
            return role === 'MANAGER'
                ? { ...prev, manager: { ...prev.manager, screens: nextScreens } }
                : { ...prev, employee: { ...prev.employee, screens: nextScreens } };
        });
    };

    const saveScreenAccess = async () => {
        if (!screenBundle) return;
        setIsScreenLoading(true);
        try {
            await Promise.all([
                apiClient.put('/permissions/screen-access', {
                    role: 'MANAGER',
                    screens: screenBundle.manager.screens,
                }),
                apiClient.put('/permissions/screen-access', {
                    role: 'EMPLOYEE',
                    screens: screenBundle.employee.screens,
                }),
            ]);

            toast({ title: 'Saved', description: 'Screen access updated successfully' });
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.response?.data?.message || 'Failed to save screen access',
                variant: 'destructive',
            });
        } finally {
            setIsScreenLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await apiClient.patch('/users/profile', profileData);
            await refreshUser();
            toast({
                title: 'Success',
                description: 'Profile updated successfully',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update profile',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: 'Error',
                description: 'New passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast({
                title: 'Error',
                description: 'Password must be at least 6 characters',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            await apiClient.patch('/users/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast({
                title: 'Success',
                description: 'Password changed successfully',
            });
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to change password',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className={isSuperAdmin ? 'grid w-full grid-cols-4' : 'grid w-full grid-cols-3'}>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    {isSuperAdmin && (
                        <TabsTrigger value="screen-access" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Screen Access
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={user?.avatar} />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                            {user ? getInitials(user.firstName, user.lastName) : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">Profile Picture</p>
                                        <p className="text-xs text-muted-foreground">
                                            Avatar is automatically generated from your name
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={profileData.firstName}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, firstName: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={profileData.lastName}
                                            onChange={(e) =>
                                                setProfileData({ ...profileData, lastName: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, email: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, phone: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Input
                                        value={user?.role?.replace('_', ' ') || ''}
                                        disabled
                                        className="capitalize"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Contact your administrator to change your role
                                    </p>
                                </div>

                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your password to keep your account secure</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                                        }
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Password must be at least 6 characters
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Change Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Manage how you receive notifications</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-sm text-muted-foreground">
                                            Receive email updates about your leads and activities
                                        </p>
                                    </div>
                                    <Button variant="outline" disabled>
                                        Coming Soon
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Tender Alerts</p>
                                        <p className="text-sm text-muted-foreground">
                                            Get notified about new matching tenders
                                        </p>
                                    </div>
                                    <Button variant="outline" disabled>
                                        Coming Soon
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Task Reminders</p>
                                        <p className="text-sm text-muted-foreground">
                                            Receive reminders for upcoming tasks
                                        </p>
                                    </div>
                                    <Button variant="outline" disabled>
                                        Coming Soon
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isSuperAdmin && (
                    <TabsContent value="screen-access">
                        <Card>
                            <CardHeader>
                                <CardTitle>Screen Access</CardTitle>
                                <CardDescription>
                                    Control which screens are available to managers and employees. Disabled screens will not appear in the sidebar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isScreenLoading && !screenBundle ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </div>
                                ) : !screenBundle ? (
                                    <div className="text-sm text-muted-foreground">No configuration found.</div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <div className="font-semibold">Manager Screens</div>
                                                <div className="space-y-2">
                                                    {screenList.map((s) => (
                                                        <label key={`manager-${s.key}`} className="flex items-center justify-between rounded-md border p-3">
                                                            <span className="text-sm">{s.label}</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={!!screenBundle.manager.screens[s.key]}
                                                                onChange={() => toggleRoleScreen('MANAGER', s.key)}
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="font-semibold">Employee Screens</div>
                                                <div className="space-y-2">
                                                    {screenList.map((s) => (
                                                        <label key={`employee-${s.key}`} className="flex items-center justify-between rounded-md border p-3">
                                                            <span className="text-sm">{s.label}</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={!!screenBundle.employee.screens[s.key]}
                                                                onChange={() => toggleRoleScreen('EMPLOYEE', s.key)}
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <Button onClick={saveScreenAccess} disabled={isScreenLoading}>
                                                {isScreenLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Screen Access
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
