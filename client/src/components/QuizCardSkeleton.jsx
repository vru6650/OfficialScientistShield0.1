const QuizCardSkeleton = () => {
    return (
        <div className="macos-tile flex h-full flex-col overflow-hidden animate-pulse">
            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="mt-4 h-6 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="mt-3 h-4 w-full rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2 h-4 w-5/6 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="mt-auto flex items-center justify-between pt-5">
                    <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                </div>
            </div>
        </div>
    );
};

export default QuizCardSkeleton;
