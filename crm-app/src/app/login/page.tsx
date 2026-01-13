'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/components/providers';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err) {
            setError('Invalid email or password. Try the demo accounts below.');
        } finally {
            setIsLoading(false);
        }
    };

    const demoAccounts = [
        { email: 'admin@crm.com', password: 'admin123', role: 'Super Admin', branch: 'All Branches' },
        { email: 'manager.del@crm.com', password: 'manager123', role: 'Manager', branch: 'Delhi' },
        { email: 'manager.mum@crm.com', password: 'manager123', role: 'Manager', branch: 'Mumbai' },
        { email: 'employee.del@crm.com', password: 'employee123', role: 'Employee', branch: 'Delhi' },
        { email: 'employee.mum@crm.com', password: 'employee123', role: 'Employee', branch: 'Mumbai' },
    ];

    const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-primary-600 to-primary-800">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg overflow-hidden">
                            <Image src="/Grow-Tenders-Logo.jpg" alt="Grow Tenders" width={48} height={48} className="object-cover" />
                        </div>
                        <span className="text-white text-xl font-semibold">Grow Tenders</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Never Miss a Government Tender Again
                    </h1>
                    <p className="text-lg text-white/80">
                        Get daily GEM tender alerts filtered by your business category and state. Win more contracts with Grow Tenders.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-8">
                        {[
                            { value: '5000+', label: 'Active Subscribers' },
                            { value: '50K+', label: 'Tenders Delivered' },
                            { value: '36', label: 'States Covered' },
                            { value: '50+', label: 'Categories' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                                <div className="text-2xl font-bold text-white">{stat.value}</div>
                                <div className="text-sm text-white/70">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-white/60 text-sm">
                    © 2026 Grow Tenders. All rights reserved.
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-14 h-14 rounded-xl mx-auto mb-4 overflow-hidden">
                            <Image src="/Grow-Tenders-Logo.jpg" alt="Grow Tenders" width={56} height={56} className="object-cover" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Grow Tenders
                        </h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Sign in to your account to continue
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-lg mb-6 bg-red-50 dark:bg-red-900/20 border border-red-500">
                            <AlertCircle size={20} className="text-red-500" />
                            <span className="text-sm text-red-600 dark:text-red-400">
                                {error}
                            </span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail size={18} />}
                            required
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<Lock size={18} />}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" className="rounded" />
                                <span className="text-gray-500 dark:text-gray-400">Remember me</span>
                            </label>
                            <a
                                href="#"
                                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                            >
                                Forgot password?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Sign in
                        </Button>
                    </form>

                    {/* Demo Accounts */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-center text-sm mb-4 text-gray-500 dark:text-gray-400">
                            Demo accounts for testing
                        </p>
                        <div className="space-y-2">
                            {demoAccounts.map((account) => (
                                <button
                                    key={account.email}
                                    type="button"
                                    onClick={() => handleDemoLogin(account.email, account.password)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                                >
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            {account.role}
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                {account.branch}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {account.email}
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                                        Use
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
