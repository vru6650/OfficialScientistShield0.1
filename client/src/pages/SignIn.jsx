import { Alert, Spinner } from 'flowbite-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
    HiOutlineArrowRight,
    HiOutlineCheckCircle,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
} from 'react-icons/hi2';

import {
    signInStart,
    signInSuccess,
    signInFailure,
} from '../redux/user/userSlice';
import { signInUser } from '../services/authService';
import OAuth from '../components/OAuth';

const signInSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
});

const credibilitySignals = [
    'Real-time progress tracking',
    'Interactive coding workspace',
    'Peer-reviewed learning paths',
];

const workspaceStats = [
    { label: 'Active learners', value: '52K+' },
    { label: 'Published tracks', value: '120+' },
    { label: 'Practice challenges', value: '340+' },
];

const inputClasses =
    'w-full rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/20';

export default function SignIn() {
    const { loading, error: errorMessage } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signInSchema),
    });

    const handleFormSubmit = async (formData) => {
        try {
            dispatch(signInStart());
            const data = await signInUser(formData);
            dispatch(signInSuccess(data));
            navigate('/');
        } catch (error) {
            dispatch(signInFailure(error.message));
        }
    };

    const isBusy = loading || isSubmitting;

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute -left-24 top-0 h-[26rem] w-[26rem] rounded-full bg-cyan-500/25 blur-[130px]" />
                <div className="absolute right-0 top-16 h-[30rem] w-[30rem] rounded-full bg-indigo-500/20 blur-[150px]" />
                <div className="absolute bottom-0 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-sky-400/15 blur-[120px]" />
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
                                Welcome back to your learning workspace.
                            </h1>
                            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                                Continue where you left off with guided tutorials, real project briefs, and focused interview practice.
                            </p>
                        </div>

                        <ul className="space-y-3">
                            {credibilitySignals.map((signal) => (
                                <li key={signal} className="flex items-center gap-3 text-sm text-slate-200">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                                        <HiOutlineCheckCircle className="h-4 w-4" aria-hidden />
                                    </span>
                                    {signal}
                                </li>
                            ))}
                        </ul>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {workspaceStats.map((stat) => (
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
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Sign in</p>
                        <h2 className="text-2xl font-bold text-white sm:text-3xl">
                            Continue building without losing momentum
                        </h2>
                    </div>

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-slate-200">
                                Work email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                autoComplete="email"
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? 'sign-in-email-error' : undefined}
                                className={inputClasses}
                                {...register('email')}
                            />
                            {errors.email ? (
                                <p id="sign-in-email-error" className="text-sm text-rose-300">
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
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={errors.password ? 'sign-in-password-error' : undefined}
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
                                <p id="sign-in-password-error" className="text-sm text-rose-300">
                                    {errors.password.message}
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
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <HiOutlineShieldCheck className="h-5 w-5" aria-hidden />
                                    Sign in to workspace
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

                        <OAuth mode="signin" className="w-full" />
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-300">
                        New to ScientistShield?{' '}
                        <Link to="/sign-up" className="font-semibold text-sky-300 underline decoration-sky-400/70 underline-offset-4 transition hover:text-sky-200">
                            Create your account
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
