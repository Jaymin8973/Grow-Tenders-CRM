'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
    const { login, verifySuperAdminOtp } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
    const [pendingEmail, setPendingEmail] = useState('');
    const [pendingPassword, setPendingPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSessionId, setOtpSessionId] = useState<string | undefined>(undefined);

    const [resendCooldown, setResendCooldown] = useState(0);
    const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const lastAutoSubmittedOtpRef = useRef<string>('');

    const otpDigits = useMemo(() => {
        const cleaned = (otp || '').replace(/\D/g, '').slice(0, 6);
        return Array.from({ length: 6 }, (_, i) => cleaned[i] || '');
    }, [otp]);

    const setOtpDigit = (index: number, value: string) => {
        const v = value.replace(/\D/g, '').slice(-1);
        const next = [...otpDigits];
        next[index] = v;
        setOtp(next.join(''));
        if (v && index < 5) {
            otpInputsRef.current[index + 1]?.focus();
        }
    };

    useEffect(() => {
        if (step !== 'otp') return;
        if (isLoading) return;
        const cleaned = otp.replace(/\D/g, '');
        if (cleaned.length !== 6) return;
        if (lastAutoSubmittedOtpRef.current === cleaned) return;
        lastAutoSubmittedOtpRef.current = cleaned;
        handleVerifyOtp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp, step]);

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

            const res = await login(data.email, data.password);
            if (res.otpRequired) {
                setPendingEmail(data.email);
                setPendingPassword(data.password);
                setOtpSessionId(res.otpSessionId);
                setStep('otp');
                setOtp('');
                setResendCooldown(30);
                toast({
                    title: 'OTP sent',
                    description: 'Please check your email for the OTP.',
                });
            } else {
                toast({
                    title: 'Welcome back!',
                    description: 'Logged in successfully.',
                });
            }
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

    useEffect(() => {
        if (step !== 'otp') return;
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown, step]);

    const handleVerifyOtp = async () => {
        setIsLoading(true);
        try {
            await verifySuperAdminOtp(pendingEmail, pendingPassword, otp, otpSessionId);
            toast({
                title: 'Welcome back!',
                description: 'Logged in successfully.',
            });
        } catch (error: any) {
            toast({
                title: 'OTP verification failed',
                description: error.response?.data?.message || error.message || 'Invalid OTP',
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
                            Track leads, manage customers, and close more sales with our powerful CRM platform.
                        </p>

                        <div className="flex gap-8 pt-8">
                            <div>
                                <p className="text-4xl font-bold">500+</p>
                                <p className="text-white/70">Active Users</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold">$2M+</p>
                                <p className="text-white/70">Sales Closed</p>
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

                    <Card className="shadow-xl border-0">
                        <CardHeader className="space-y-2 pb-8">
                            <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
                            <CardDescription className="text-center text-base">
                                {step === 'credentials'
                                    ? 'Sign in to your account to continue'
                                    : 'Enter the OTP sent to your email'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {step === 'credentials' ? (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
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
                                        <Label htmlFor="password">Password</Label>
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
                                        className="w-full h-11 text-base font-semibold"
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
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>OTP</Label>
                                            <span className="text-xs text-muted-foreground">Sent to {pendingEmail}</span>
                                        </div>
                                        <div className="flex gap-2 justify-center">
                                            {otpDigits.map((d, idx) => (
                                                <Input
                                                    key={idx}
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={d}
                                                    ref={(el) => {
                                                        otpInputsRef.current[idx] = el;
                                                    }}
                                                    onChange={(e) => setOtpDigit(idx, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Backspace') {
                                                            if (!otpDigits[idx] && idx > 0) {
                                                                otpInputsRef.current[idx - 1]?.focus();
                                                            }
                                                        }
                                                        if (e.key === 'ArrowLeft' && idx > 0) {
                                                            otpInputsRef.current[idx - 1]?.focus();
                                                        }
                                                        if (e.key === 'ArrowRight' && idx < 5) {
                                                            otpInputsRef.current[idx + 1]?.focus();
                                                        }
                                                    }}
                                                    className="h-12 w-12 text-center text-lg font-semibold"
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">
                                            OTP expires soon. If you didn’t receive it, you can resend.
                                        </p>
                                    </div>

                                    <Button
                                        className="w-full h-11 text-base font-semibold"
                                        disabled={isLoading || otp.replace(/\D/g, '').length !== 6}
                                        onClick={handleVerifyOtp}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                Verify & Continue
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled={isLoading || resendCooldown > 0}
                                        onClick={async () => {
                                            setIsLoading(true);
                                            try {
                                                const res = await login(pendingEmail, pendingPassword);
                                                if (res.otpRequired) {
                                                    setOtpSessionId(res.otpSessionId);
                                                    setOtp('');
                                                    setResendCooldown(30);
                                                    setTimeout(() => otpInputsRef.current[0]?.focus(), 0);
                                                }
                                                toast({ title: 'OTP resent', description: 'Please check your email.' });
                                            } catch (e: any) {
                                                toast({
                                                    title: 'Failed to resend OTP',
                                                    description: e.response?.data?.message || 'Please try again',
                                                    variant: 'destructive',
                                                });
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }}
                                    >
                                        {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full border border-gray-200"
                                        disabled={isLoading}
                                        onClick={() => {
                                            setStep('credentials');
                                            setOtp('');
                                            setOtpSessionId(undefined);
                                            setResendCooldown(0);
                                        }}
                                    >
                                        Back to login
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
