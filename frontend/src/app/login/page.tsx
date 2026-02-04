'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // Load saved credentials on mount
    useEffect(() => {
        const savedCredentials = localStorage.getItem('rememberedCredentials');
        if (savedCredentials) {
            try {
                const { email, password } = JSON.parse(savedCredentials);
                setValue('email', email);
                setValue('password', password);
                setRememberMe(true);
            } catch (e) {
                localStorage.removeItem('rememberedCredentials');
            }
        }
    }, [setValue]);

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            // Save or remove credentials based on Remember Me
            if (rememberMe) {
                localStorage.setItem('rememberedCredentials', JSON.stringify({
                    email: data.email,
                    password: data.password,
                }));
            } else {
                localStorage.removeItem('rememberedCredentials');
            }

            await login(data.email, data.password);
            toast({
                title: 'Welcome back!',
                description: 'Logged in successfully.',
            });
        } catch (error: any) {
            toast({
                title: 'Login failed',
                description: error.response?.data?.message || 'Invalid credentials',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />

                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <div className="flex items-center">
                        <Image
                            src="/images/logo.jpg"
                            alt="Grow Tenders Logo"
                            width={280}
                            height={90}
                            className="h-20 w-auto object-contain rounded-xl bg-white p-2 shadow-lg"
                        />
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-5xl font-bold leading-tight">
                            Empower Your<br />
                            Sales Team
                        </h1>
                        <p className="text-xl text-white/80 max-w-md">
                            Track leads, manage deals, and close more sales with our powerful CRM platform.
                        </p>

                        <div className="flex gap-8 pt-8">
                            <div>
                                <p className="text-4xl font-bold">500+</p>
                                <p className="text-white/70">Active Users</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold">$2M+</p>
                                <p className="text-white/70">Deals Closed</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold">98%</p>
                                <p className="text-white/70">Satisfaction</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-white/50 text-sm">
                        © 2026 Grow Tenders. All rights reserved.
                    </p>
                </div>

                {/* Decorative circles */}
                <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-white/10" />
                <div className="absolute -right-16 top-1/2 w-64 h-64 rounded-full bg-white/5" />
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center mb-8">
                        <Image
                            src="/images/logo.jpg"
                            alt="Grow Tenders Logo"
                            width={240}
                            height={70}
                            className="h-16 w-auto object-contain"
                        />
                    </div>

                    <Card className="border-0 shadow-xl">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                            <CardDescription>
                                Enter your credentials to access your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@company.com"
                                            {...register('email')}
                                            className="pl-10 h-11"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            {...register('password')}
                                            className="pl-10 h-11"
                                        />
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password.message}</p>
                                    )}
                                </div>

                                {/* Remember Me Checkbox */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                    />
                                    <Label
                                        htmlFor="rememberMe"
                                        className="text-sm font-normal cursor-pointer text-muted-foreground"
                                    >
                                        Remember me
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base font-medium"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Demo Credentials */}
                            <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200">
                                <p className="text-sm font-medium text-slate-700 mb-3">
                                    Demo Accounts
                                </p>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between p-2 rounded-lg bg-white">
                                        <span className="text-slate-600">Admin</span>
                                        <span className="font-mono text-slate-800">admin@example.com</span>
                                    </div>
                                    <div className="flex justify-between p-2 rounded-lg bg-white">
                                        <span className="text-slate-600">Manager</span>
                                        <span className="font-mono text-slate-800">manager@example.com</span>
                                    </div>
                                    <div className="flex justify-between p-2 rounded-lg bg-white">
                                        <span className="text-slate-600">Employee</span>
                                        <span className="font-mono text-slate-800">employee@example.com</span>
                                    </div>
                                    <p className="text-center text-slate-500 pt-2">
                                        Password: <span className="font-mono">Role@123</span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
