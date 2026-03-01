import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { HiOutlineBookOpen, HiOutlineClock, HiOutlineSparkles } from 'react-icons/hi2';

const TutorialCard = ({ tutorial }) => {
    const shouldReduceMotion = useReducedMotion();
    const rawReadingTime = Math.ceil((tutorial.content?.length || 0) / 1000);
    const readingTime = rawReadingTime > 0 ? rawReadingTime : 5;
    const chapterCount = Array.isArray(tutorial.chapters) ? tutorial.chapters.length : null;
    const categoryLabel = tutorial.category || 'General';
    const description = tutorial.description || 'Explore this guided tutorial to sharpen your skills.';

    return (
        <Link to={`/tutorials/${tutorial.slug}`} className="group block h-full">
            <motion.article
                className="macos-tile flex h-full flex-col overflow-hidden"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
            >
                <div className="relative">
                    <img
                        src={tutorial.thumbnail || 'https://via.placeholder.com/640x360?text=Tutorial+Preview'}
                        alt={tutorial.title}
                        className="h-44 w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                    />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-200">
                        <HiOutlineClock className="h-4 w-4 text-sky-500" aria-hidden />
                        {readingTime} min read
                    </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                        <HiOutlineSparkles className="h-4 w-4 text-sky-500" aria-hidden />
                        {categoryLabel}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900 transition group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-300">
                        {tutorial.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3 dark:text-slate-300">
                        {description}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-5">
                        <span className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <HiOutlineBookOpen className="h-4 w-4" aria-hidden />
                            {chapterCount ? `${chapterCount} chapters` : 'Self-paced'}
                        </span>
                        <span className="macos-chip text-[11px] font-semibold uppercase tracking-widest">
                            Open tutorial
                        </span>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
};

export default TutorialCard;
