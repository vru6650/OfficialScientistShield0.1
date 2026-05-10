// A reusable skeleton component for a loading PostCard.
export default function PostCardSkeleton() {
    return (
        <div className='group relative min-h-[22rem] w-full overflow-hidden rounded-lg border border-teal-500 transition-all hover:border-2 animate-pulse'>
            <div className='aspect-[16/10] w-full bg-gray-300 dark:bg-gray-600' />
            <div className='p-3 flex flex-col gap-2'>
                <div className='p-3 h-6 bg-gray-300 dark:bg-gray-600 rounded-md' />
                <div className='p-2 h-4 bg-gray-300 dark:bg-gray-600 rounded-md w-1/4' />
            </div>
        </div>
    );
}
