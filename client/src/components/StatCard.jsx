import { HiArrowUp, HiArrowDown, HiMinusSm } from 'react-icons/hi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';

/**
 * An advanced, reusable card for displaying key statistics with dynamic change indicators and a loading state.
 */
export default function StatCard({
                                     title,
                                     count,
                                     lastMonthCount,
                                     icon: Icon,
                                     iconBgColor,
                                     loading,
                                 }) {
    // 1. Add a skeleton loading state for better UX
    if (loading) {
        return (
            <div className='glass-card flex flex-col p-3 gap-4 md:w-72 w-full'>
                <div className='flex justify-between'>
                    <div>
                        <h3 className='text-gray-500 text-md uppercase'><Skeleton width={100} /></h3>
                        <p className='text-2xl'><Skeleton width={50} /></p>
                    </div>
                    <Skeleton circle height={50} width={50} />
                </div>
                <div className='flex gap-2 text-sm'>
                    <Skeleton width={80} />
                </div>
            </div>
        );
    }

    // 2. Calculate the change and format numbers
    const change = count - lastMonthCount;
    // Handle division by zero case
    const percentageChange =
        lastMonthCount > 0 ? ((change / lastMonthCount) * 100).toFixed(1) : 0;

    // Format large numbers for readability (e.g., 12500 -> 12.5K)
    const formattedCount = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
    }).format(count);

    // 3. Determine the color and icon based on the change
    const isPositive = change > 0;
    const isNegative = change < 0;
    const changeColor = isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500';
    const ChangeIcon = isPositive ? HiArrowUp : isNegative ? HiArrowDown : HiMinusSm;

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className='glass-card flex flex-col p-4 gap-4 w-full rounded-2xl'>
            <div className='flex justify-between items-start'>
                <div>
                    <h3 className='text-gray-500 text-md uppercase font-semibold'>{title}</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>{formattedCount}</p>
                </div>
                <div className={`p-3 rounded-full ${iconBgColor}`}>
                    <Icon
                        className={`text-white text-2xl shadow-lg`}
                    />
                </div>
            </div>
            <div className='flex gap-2 text-sm items-center'>
                <span className={`${changeColor} flex items-center font-bold`}>
                  <ChangeIcon className='h-5 w-5' />
                    {Math.abs(percentageChange)}%
                </span>
                <div className='text-gray-500 dark:text-gray-400'>Since last month</div>
            </div>
        </motion.div>
    );
}
