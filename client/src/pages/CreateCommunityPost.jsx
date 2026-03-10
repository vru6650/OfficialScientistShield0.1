import { useState } from 'react';
import { Alert, Button, Select, Spinner, TextInput, Textarea } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createCommunityPost } from '../services/communityPostService.js';

const categories = [
    { value: 'community', label: 'Community' },
    { value: 'show-and-tell', label: 'Show & Tell' },
    { value: 'help', label: 'Help request' },
    { value: 'tips', label: 'Tips & learnings' },
];

export default function CreateCommunityPost() {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '',
        category: 'community',
        content: '',
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!form.title.trim() || !form.content.trim()) {
            setError('Please add a title and some content.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...form,
                kind: 'community',
            };
            await createCommunityPost(payload);
            setSuccess('Post published! Redirecting you to community posts…');
            setTimeout(() => navigate('/posts?kind=community'), 600);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_28%)]' aria-hidden />
            <div className='relative mx-auto max-w-4xl space-y-8'>
                <header className='space-y-3'>
                    <p className='text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300'>Community post</p>
                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Share with the community</h1>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                        Announcements, questions, learnings, or demos—write it up and let peers respond.
                    </p>
                    {currentUser?.isAdmin && (
                        <p className='text-xs text-emerald-600 dark:text-emerald-300'>
                            Admin tip: use the regular post flow for official releases. This one is community-led.
                        </p>
                    )}
                </header>

                <form onSubmit={handleSubmit} className='space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900'>
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

                    <div className='space-y-2'>
                        <label className='text-sm font-semibold text-slate-700 dark:text-slate-200' htmlFor='title'>
                            Title
                        </label>
                        <TextInput
                            id='title'
                            required
                            value={form.title}
                            onChange={handleChange('title')}
                            placeholder='What do you want to share?'
                        />
                    </div>

                    <div className='space-y-2'>
                        <label className='text-sm font-semibold text-slate-700 dark:text-slate-200' htmlFor='category'>
                            Category
                        </label>
                        <Select id='category' value={form.category} onChange={handleChange('category')}>
                            {categories.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className='space-y-2'>
                        <label className='text-sm font-semibold text-slate-700 dark:text-slate-200' htmlFor='content'>
                            Content
                        </label>
                        <Textarea
                            id='content'
                            rows={12}
                            value={form.content}
                            onChange={handleChange('content')}
                            placeholder='Share context, links, code snippets, or questions.'
                        />
                        <p className='text-xs text-slate-500 dark:text-slate-400'>
                            Markdown/HTML not required—plain text works fine.
                        </p>
                    </div>

                    <div className='flex items-center justify-end gap-3'>
                        <Button color='light' onClick={() => setForm({ title: '', category: 'community', content: '' })} type='button'>
                            Reset
                        </Button>
                        <Button type='submit' gradientDuoTone='cyanToBlue' disabled={submitting}>
                            {submitting ? <Spinner size='sm' /> : 'Publish'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
