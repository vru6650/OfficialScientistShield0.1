import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineArrowUp, HiOutlineArrowUpRight, HiOutlinePaperAirplane } from 'react-icons/hi2';

import { footerLinks, socialMediaLinks } from '../data/footerData';
import FooterWave from './FooterWave';

const isExternalLink = (href) => /^https?:\/\//i.test(href);

export default function FooterCom() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 360);
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSubscribe = (event) => {
        event.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setStatus({ type: 'error', message: 'Enter your email to subscribe.' });
            return;
        }
        setStatus({ type: 'success', message: 'Thanks. You are on the early access list.' });
        setEmail('');
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="liquid-app-shell relative mt-24">
            <FooterWave />
            <div className="liquid-hybrid-panel liquid-hybrid-band relative overflow-hidden border-t border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/70">
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                    <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
                    <div className="absolute right-0 top-14 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10">
                    <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                        <section className="space-y-6">
                            <Link
                                to="/"
                                className="liquid-hybrid-tile inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-sky-400/50 dark:hover:text-sky-300"
                            >
                                <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" aria-hidden />
                                ScientistShield
                            </Link>
                            <div className="space-y-3">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Build modern products with better learning loops.
                                </h2>
                                <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    Tutorials, project briefs, coding challenges, and practical UX patterns in one focused workspace.
                                </p>
                            </div>

                            <form className="max-w-lg space-y-3" onSubmit={handleSubscribe} noValidate>
                                <label htmlFor="newsletter-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Weekly product & engineering digest
                                </label>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <input
                                        id="newsletter-email"
                                        type="email"
                                        value={email}
                                        onChange={(event) => {
                                            setEmail(event.target.value);
                                            if (status.message) {
                                                setStatus({ type: '', message: '' });
                                            }
                                        }}
                                        placeholder="name@company.com"
                                        className="liquid-hybrid-input h-11 flex-1 rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-700 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:ring-sky-900/40"
                                    />
                                    <button
                                        type="submit"
                                        className="btn-aqua inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 dark:focus-visible:ring-sky-900/50"
                                    >
                                        <HiOutlinePaperAirplane className="h-4 w-4" aria-hidden />
                                        Subscribe
                                    </button>
                                </div>
                                {status.message ? (
                                    <p className={`text-sm ${status.type === 'error' ? 'text-rose-500 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                                        {status.message}
                                    </p>
                                ) : null}
                            </form>
                        </section>

                        <section className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                            {footerLinks.map((section) => (
                                <div key={section.title} className="space-y-3">
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                        {section.title}
                                    </h3>
                                    <ul className="space-y-2 text-sm">
                                        {section.links.map((link) => (
                                            <li key={`${section.title}-${link.name}`}>
                                                {isExternalLink(link.href) ? (
                                                    <a
                                                        href={link.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-slate-600 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
                                                    >
                                                        {link.name}
                                                        <HiOutlineArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                                                    </a>
                                                ) : (
                                                    <Link
                                                        to={link.href}
                                                        className="text-slate-600 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
                                                    >
                                                        {link.name}
                                                    </Link>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </section>
                    </div>

                    <div className="mt-10 flex flex-col-reverse gap-4 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/70">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            © {new Date().getFullYear()} ScientistShield. Crafted for practical learning.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialMediaLinks.map((social) => (
                                <motion.a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Visit ${social.name}`}
                                    whileHover={{ y: -2, scale: 1.08 }}
                                    whileTap={{ scale: 0.94 }}
                                    className="liquid-hybrid-tile inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-sky-400/50 dark:hover:text-sky-300"
                                >
                                    <social.icon className="h-4 w-4" />
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isVisible ? (
                    <motion.button
                        type="button"
                        onClick={scrollToTop}
                        initial={{ opacity: 0, y: 12, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.9 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="btn-aqua fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/50 dark:text-white"
                        aria-label="Back to top"
                    >
                        <HiOutlineArrowUp className="h-5 w-5" />
                    </motion.button>
                ) : null}
            </AnimatePresence>
        </footer>
    );
}
