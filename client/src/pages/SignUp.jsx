import { Alert, Spinner } from 'flowbite-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowRight,
    HiOutlineCheckCircle,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
} from 'react-icons/hi2';

import { signUpUser } from '../services/authService';
import OAuth from '../components/OAuth';

const signUpSchema = z
    .object({
        username: z
            .string()
            .min(3, 'Username must be at least 3 characters long.')
            .max(20, 'Username must be no more than 20 characters long.')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
        email: z.string().email('Please enter a valid email address.'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters long.')
            .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
            .regex(/[0-9]/, 'Password must contain at least one number.'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });

const onboardingHighlights = [
    'Build a personalized learning roadmap',
    'Track progress across tutorials and challenges',
    'Share work and get fast community feedback',
];

const onboardingStats = [
    { label: 'Countries', value: '90+' },
    { label: 'Projects', value: '340+' },
    { label: 'Guided tracks', value: '120+' },
];

const inputClasses =
    'w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/20';

export default function SignUp() {
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signUpSchema),
    });

    const handleFormSubmit = async (formData) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const payload = { ...formData };
            delete payload.confirmPassword;
            await signUpUser(payload);
            navigate('/sign-in');
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const isBusy = loading || isSubmitting;

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute -left-20 top-6 h-[24rem] w-[24rem] rounded-full bg-sky-500/20 blur-[120px]" />
                <div className="absolute right-0 top-20 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-[140px]" />
                <div className="absolute bottom-0 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/15 bg-slate-900/55 shadow-[0_48px_120px_-56px_rgba(2,132,199,0.6)] backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr]"
            >
                <section className="relative border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/15 via-transparent to-indigo-400/10" aria-hidden />
                    <div className="relative space-y-8">
                        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-100">
                            <HiOutlineSparkles className="h-4 w-4 text-cyan-300" aria-hidden />
                            ScientistShield
                        </Link>

                        <div className="space-y-4">
                            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                                Build your account and start shipping better work.
                            </h1>
                            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                                Join a modern learning space designed for developers who want practical projects, polished UX habits, and real momentum.
                            </p>
                        </div>

                        <ul className="space-y-3">
                            {onboardingHighlights.map((signal) => (
                                <li key={signal} className="flex items-center gap-3 text-sm text-slate-200">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                                        <HiOutlineCheckCircle className="h-4 w-4" aria-hidden />
                                    </span>
                                    {signal}
                                </li>
                            ))}
                        </ul>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {onboardingStats.map((stat) => (
                                <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                                    <p className="text-lg font-bold text-white">{stat.value}</p>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="p-7 sm:p-10">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Create account</p>
                        <h2 className="text-2xl font-bold text-white sm:text-3xl">
                            Set up your workspace in under a minute
                        </h2>
                    </div>

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
                        <div className="space-y-2">
                            <label htmlFor="username" className="text-sm font-medium text-slate-200">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                placeholder="your_handle"
                                aria-invalid={Boolean(errors.username)}
                                aria-describedby={errors.username ? 'sign-up-username-error' : undefined}
                                className={inputClasses}
                                {...register('username')}
                            />
                            {errors.username ? (
                                <p id="sign-up-username-error" className="text-sm text-rose-300">
                                    {errors.username.message}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-slate-200">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="name@company.com"
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? 'sign-up-email-error' : undefined}
                                className={inputClasses}
                                {...register('email')}
                            />
                            {errors.email ? (
                                <p id="sign-up-email-error" className="text-sm text-rose-300">
                                    {errors.email.message}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-slate-200">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="At least 8 characters"
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={errors.password ? 'sign-up-password-error' : 'sign-up-password-hint'}
                                    className={`${inputClasses} pr-11`}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute inset-y-0 right-3 inline-flex items-center text-slate-400 transition hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 rounded-md"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password ? (
                                <p id="sign-up-password-error" className="text-sm text-rose-300">
                                    {errors.password.message}
                                </p>
                            ) : (
                                <p id="sign-up-password-hint" className="text-xs text-slate-400">
                                    Use at least one letter and one number.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
                                Confirm password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Re-enter your password"
                                    aria-invalid={Boolean(errors.confirmPassword)}
                                    aria-describedby={errors.confirmPassword ? 'sign-up-confirm-password-error' : undefined}
                                    className={`${inputClasses} pr-11`}
                                    {...register('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((value) => !value)}
                                    className="absolute inset-y-0 right-3 inline-flex items-center text-slate-400 transition hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 rounded-md"
                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                    {showConfirmPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword ? (
                                <p id="sign-up-confirm-password-error" className="text-sm text-rose-300">
                                    {errors.confirmPassword.message}
                                </p>
                            ) : null}
                        </div>

                        <button
                            type="submit"
                            disabled={isBusy}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_-30px_rgba(14,165,233,0.8)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isBusy ? (
                                <>
                                    <Spinner size="sm" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <HiOutlineShieldCheck className="h-5 w-5" aria-hidden />
                                    Create free account
                                    <HiOutlineArrowRight className="h-4 w-4" aria-hidden />
                                </>
                            )}
                        </button>

                        <div className="relative py-1">
                            <div className="absolute inset-0 flex items-center" aria-hidden>
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-slate-900 px-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                                    or continue with
                                </span>
                            </div>
                        </div>

                        <OAuth mode="signup" className="w-full" />
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-300">
                        Already have an account?{' '}
                        <Link to="/sign-in" className="font-semibold text-sky-300 underline decoration-sky-400/70 underline-offset-4 transition hover:text-sky-200">
                            Sign in
                        </Link>
                    </p>

                    {errorMessage ? (
                        <Alert color="failure" className="mt-6">
                            {errorMessage}
                        </Alert>
                    ) : null}
                </section>
            </motion.div>
        </div>
    );
}
