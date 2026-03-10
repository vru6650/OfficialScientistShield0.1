import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Checkbox, Label, Select, Spinner, Textarea, TextInput } from 'flowbite-react';
import { useSelector } from 'react-redux';
import { HiOutlineChatBubbleBottomCenterText, HiOutlineGlobeAlt, HiOutlineSparkles, HiOutlineUsers } from 'react-icons/hi2';
import { submitCommunityForm } from '../services/communityService';

const MAX_INTERESTS = 6;

const interestOptions = [
    'Frontend',
    'Backend',
    'Fullstack',
    'AI / ML',
    'Data Engineering',
    'DevOps',
    'Security',
    'Mobile',
    'Game Dev',
    'Open Source',
    'Design Systems',
    'Technical Writing',
];

const roleOptions = [
    'Student',
    'Professional',
    'Career switcher',
    'Educator / Mentor',
    'Founder / Indie hacker',
    'Other',
];

const experienceOptions = ['Beginner', 'Intermediate', 'Advanced'];

const initialForm = {
    name: '',
    email: '',
    role: roleOptions[0],
    experienceLevel: experienceOptions[0],
    goals: '',
    interests: [],
    message: '',
    consentToContact: true,
};

const Stat = ({ icon: Icon, label, value }) => (
    <div className='flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white shadow-sm backdrop-blur'>
        <span className='inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl'>
            <Icon aria-hidden />
        </span>
        <div>
            <p className='text-sm text-white/70'>{label}</p>
            <p className='text-xl font-semibold'>{value}</p>
        </div>
    </div>
);

export default function Community() {
    const { currentUser } = useSelector((state) => state.user);
    const [form, setForm] = useState(() => ({
        ...initialForm,
        name: currentUser?.username || '',
        email: currentUser?.email || '',
    }));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const selectedInterests = useMemo(() => new Set(form.interests), [form.interests]);

    const updateField = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const toggleInterest = (interest) => {
        setForm((prev) => {
            const next = new Set(prev.interests);
            if (next.has(interest)) {
                next.delete(interest);
            } else if (next.size >= MAX_INTERESTS) {
                return prev;
            } else {
                next.add(interest);
            }
            return { ...prev, interests: Array.from(next) };
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!form.name.trim() || !form.email.trim()) {
            setError('Please add your name and a valid email.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...form,
                interests: form.interests,
                consentToContact: Boolean(form.consentToContact),
            };
            await submitCommunityForm(payload);
            setSuccess('Thanks! We received your details and will reach out soon.');
            setForm((prev) => ({
                ...initialForm,
                name: currentUser?.username || '',
                email: currentUser?.email || '',
                role: prev.role,
                experienceLevel: prev.experienceLevel,
            }));
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.22),transparent_30%),radial-gradient(circle_at_50%_70%,rgba(16,185,129,0.16),transparent_32%)]' aria-hidden />
            <div className='relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 lg:px-8'>
                <header className='grid gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_120px_-60px_rgba(14,165,233,0.35)] backdrop-blur lg:grid-cols-[1.05fr,0.95fr] lg:items-center'>
                    <div className='space-y-5'>
                        <div className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]'>
                            <HiOutlineSparkles className='h-4 w-4' aria-hidden />
                            Join the Community
                        </div>
                        <div className='space-y-3'>
                            <h1 className='text-4xl font-extrabold leading-tight sm:text-5xl'>
                                Tell us how you want to learn, build, and collaborate
                            </h1>
                            <p className='text-base text-white/80 sm:text-lg'>
                                Share your focus areas and we will pair you with the right circles, review pods, and live build sessions.
                            </p>
                        </div>
                        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                            <Stat icon={HiOutlineUsers} label='Members' value='52K+' />
                            <Stat icon={HiOutlineGlobeAlt} label='Countries' value='90+' />
                            <Stat icon={HiOutlineChatBubbleBottomCenterText} label='Weekly sessions' value='120+' />
                            <Stat icon={HiOutlineSparkles} label='Active tracks' value='35' />
                        </div>
                    </div>
                    <div className='rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur'>
                        <div className='space-y-2'>
                            <p className='text-sm uppercase tracking-[0.28em] text-cyan-200'>What happens next</p>
                            <ul className='space-y-3 text-sm text-white/80'>
                                <li>• We match you with a study circle or reviewer within 3–5 business days.</li>
                                <li>• You get a starter kit: onboarding tips, starter labs, and community guidelines.</li>
                                <li>• You choose your cadence—weekly live builds, async feedback, or both.</li>
                            </ul>
                        </div>
                        <div className='flex flex-wrap gap-3 pt-2'>
                            <Button gradientDuoTone='cyanToBlue' onClick={() => window.location.assign('/community/create')}>
                                Publish a community post
                            </Button>
                            <Button color='light' onClick={() => window.location.assign('/posts?kind=community')}>
                                Browse community posts
                            </Button>
                        </div>
                    </div>
                </header>

                <section className='grid gap-8 lg:grid-cols-[1.1fr,0.9fr]'>
                    <form
                        onSubmit={handleSubmit}
                        className='space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur'
                    >
                        <div className='flex flex-col gap-2'>
                            <p className='text-sm uppercase tracking-[0.24em] text-cyan-200'>Share your details</p>
                            <h2 className='text-2xl font-semibold'>We use this to tailor your experience</h2>
                        </div>

                        {error && (
                            <Alert color='failure' onDismiss={() => setError(null)}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert color='success' onDismiss={() => setSuccess(null)}>
                                {success}
                            </Alert>
                        )}

                        <div className='grid gap-4 sm:grid-cols-2'>
                            <div className='space-y-1'>
                                <Label htmlFor='name' value='Full name' className='text-white/90' />
                                <TextInput
                                    id='name'
                                    required
                                    value={form.name}
                                    onChange={updateField('name')}
                                    placeholder='Ada Lovelace'
                                />
                            </div>
                            <div className='space-y-1'>
                                <Label htmlFor='email' value='Email' className='text-white/90' />
                                <TextInput
                                    id='email'
                                    type='email'
                                    required
                                    value={form.email}
                                    onChange={updateField('email')}
                                    placeholder='you@example.com'
                                />
                            </div>
                        </div>

                        <div className='grid gap-4 sm:grid-cols-2'>
                            <div className='space-y-1'>
                                <Label htmlFor='role' value='Primary role' className='text-white/90' />
                                <Select id='role' value={form.role} onChange={updateField('role')}>
                                    {roleOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div className='space-y-1'>
                                <Label htmlFor='experience' value='Experience level' className='text-white/90' />
                                <Select
                                    id='experience'
                                    value={form.experienceLevel}
                                    onChange={updateField('experienceLevel')}
                                >
                                    {experienceOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>

                        <div className='space-y-1'>
                            <Label htmlFor='goals' value='What do you want to achieve in the next 90 days?' className='text-white/90' />
                            <TextInput
                                id='goals'
                                value={form.goals}
                                onChange={updateField('goals')}
                                placeholder='e.g., Ship a React portfolio, learn system design fundamentals'
                            />
                        </div>

                        <div className='space-y-3'>
                            <Label value={`Pick your top interests (up to ${MAX_INTERESTS})`} className='text-white/90' />
                            <div className='flex flex-wrap gap-2'>
                                {interestOptions.map((interest) => {
                                    const selected = selectedInterests.has(interest);
                                    return (
                                        <button
                                            type='button'
                                            key={interest}
                                            onClick={() => toggleInterest(interest)}
                                            disabled={!selected && form.interests.length >= MAX_INTERESTS}
                                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                                selected
                                                    ? 'border-cyan-300 bg-cyan-500/20 text-cyan-50 shadow'
                                                    : 'border-white/15 bg-white/5 text-white/80 hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-45'
                                            }`}
                                        >
                                            {interest}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className='text-xs text-white/55'>
                                {form.interests.length}/{MAX_INTERESTS} selected
                            </p>
                        </div>

                        <div className='space-y-1'>
                            <Label htmlFor='message' value='Anything else you want us to know?' className='text-white/90' />
                            <Textarea
                                id='message'
                                rows={4}
                                value={form.message}
                                onChange={updateField('message')}
                                placeholder='Share a project link, learning preference, or time-zone.'
                            />
                        </div>

                        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex items-center gap-2'>
                                <Checkbox
                                    id='consent'
                                    checked={form.consentToContact}
                                    onChange={(event) =>
                                        setForm((prev) => ({ ...prev, consentToContact: event.target.checked }))
                                    }
                                />
                                <Label htmlFor='consent' className='text-sm text-white/80'>
                                    I agree to be contacted about community programs.
                                </Label>
                            </div>
                            <div className='flex items-center gap-3'>
                                <Badge color='success' className='bg-emerald-500/20 text-emerald-100'>
                                    Human review in 3–5 business days
                                </Badge>
                                <Button type='submit' gradientDuoTone='cyanToBlue' disabled={submitting}>
                                    {submitting ? <Spinner size='sm' /> : 'Submit'}
                                </Button>
                            </div>
                        </div>
                    </form>

                    <aside className='space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur'>
                        <p className='text-sm uppercase tracking-[0.24em] text-cyan-200'>What you get</p>
                        <div className='space-y-3 text-sm text-white/80'>
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                                <p className='text-base font-semibold text-white'>Study circles</p>
                                <p>Weekly small-group sessions focused on accountability and momentum.</p>
                            </div>
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                                <p className='text-base font-semibold text-white'>Reviewer feedback</p>
                                <p>Actionable notes on UI polish, accessibility, and performance.</p>
                            </div>
                            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                                <p className='text-base font-semibold text-white'>Build tracks</p>
                                <p>Curated prompts and labs mapped to your goals and time budget.</p>
                            </div>
                        </div>
                        <div className='rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-emerald-500/20 p-4 text-sm text-white/85'>
                            <p className='font-semibold'>Privacy first</p>
                            <p className='text-white/80'>
                                We only use your details to coordinate community participation. You can request deletion anytime.
                            </p>
                        </div>
                    </aside>
                </section>
            </div>
        </div>
    );
}
