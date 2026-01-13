'use client';

import { useState } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Building2,
    Bell,
    Mail,
    Shield,
    Palette,
    Database,
    Save,
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuth, useTheme } from '@/components/providers';
import { cn } from '@/lib/utils';

const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
    const { user } = useAuth();
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <SettingsIcon size={24} />
                    Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Manage your account and application preferences
                </p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <Card className="w-64 p-2 h-fit flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                                    )}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </Card>

                {/* Content Area */}
                <div className="flex-1">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <Card>
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Update your personal information and profile picture
                                </p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-primary-500 to-primary-700">
                                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    </div>
                                    <div>
                                        <Button variant="secondary" size="sm">Change Photo</Button>
                                        <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                                            JPG, GIF or PNG. Max size 2MB.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="First Name" defaultValue={user?.firstName} />
                                    <Input label="Last Name" defaultValue={user?.lastName} />
                                    <Input label="Email" type="email" defaultValue={user?.email} className="col-span-2" />
                                    <Input label="Phone" placeholder="+1 234 567 890" />
                                    <Input label="Job Title" placeholder="Sales Representative" />
                                </div>

                                <div className="flex justify-end">
                                    <Button>
                                        <Save size={16} />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <Card>
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Customize how the application looks
                                </p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-sm font-medium mb-3 block text-gray-700 dark:text-gray-300">Theme</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {(['light', 'dark', 'system'] as const).map((themeOption) => (
                                            <button
                                                key={themeOption}
                                                onClick={() => setTheme(themeOption)}
                                                className={cn(
                                                    "p-4 rounded-lg border-2 transition-all bg-white dark:bg-gray-800",
                                                    theme === themeOption
                                                        ? "border-primary-500 ring-2 ring-primary-500/20"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-full h-16 rounded-md mb-3",
                                                        themeOption === 'light' && "bg-gray-100",
                                                        themeOption === 'dark' && "bg-gray-900",
                                                        themeOption === 'system' && "bg-gradient-to-br from-gray-100 via-gray-100 to-gray-900"
                                                    )}
                                                />
                                                <div className="text-sm font-medium capitalize text-gray-900 dark:text-white">{themeOption}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <Card>
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Choose what notifications you receive
                                </p>
                            </div>
                            <div className="p-6 space-y-4">
                                {[
                                    { label: 'New lead assigned', description: 'Get notified when a new lead is assigned to you' },
                                    { label: 'Deal updates', description: 'Get notified when deals you own are updated' },
                                    { label: 'Follow-up reminders', description: 'Receive reminders for scheduled follow-ups' },
                                    { label: 'Team announcements', description: 'Important updates from your team' },
                                    { label: 'Weekly reports', description: 'Weekly summary of your performance' },
                                ].map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                                    >
                                        <div>
                                            <div className="font-medium text-sm text-gray-900 dark:text-white">{item.label}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {item.description}
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Other tabs placeholder */}
                    {!['profile', 'appearance', 'notifications'].includes(activeTab) && (
                        <Card className="p-12 text-center">
                            <Database size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Coming Soon</h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                This settings section is under development.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
