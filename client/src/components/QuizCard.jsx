import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
    HiOutlineQuestionMarkCircle,
    HiOutlineRectangleStack,
    HiOutlineSparkles,
} from 'react-icons/hi2';

const QuizCard = ({ quiz }) => {
    const shouldReduceMotion = useReducedMotion();
    const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
    const categoryLabel = quiz.category || 'General';

    return (
        <Link to={`/quizzes/${quiz.slug}`} className="group block h-full">
            <motion.article
                className="macos-tile flex h-full flex-col overflow-hidden"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
            >
                <div className="relative border-b border-slate-200/70 bg-gradient-to-br from-sky-100/80 via-white to-indigo-100/70 p-5 dark:border-slate-700/70 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/70">
                    <div className="flex items-center justify-between gap-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-900/70 dark:text-slate-300">
                            <HiOutlineSparkles className="h-4 w-4 text-sky-500" aria-hidden />
                            {categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <HiOutlineRectangleStack className="h-4 w-4" aria-hidden />
                            {questionCount} questions
                        </span>
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-slate-900 transition group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-300">
                        {quiz.title}
                    </h2>
                    {quiz.description && (
                        <p className="mt-2 text-sm text-slate-600 line-clamp-3 dark:text-slate-300">
                            {quiz.description}
                        </p>
                    )}
                </div>
                <div className="flex items-center justify-between p-5">
                    <span className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <HiOutlineQuestionMarkCircle className="h-4 w-4" aria-hidden />
                        Quick knowledge check
                    </span>
                    <span className="macos-chip text-[11px] font-semibold uppercase tracking-widest">
                        Start quiz
                    </span>
                </div>
            </motion.article>
        </Link>
    );
};

export default QuizCard;
