import { useMemo } from 'react';
import { Button, Select, TextInput, ToggleSwitch } from 'flowbite-react';

const defaultDifficulties = ['Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'];

export default function ProblemFilters({
    searchValue,
    onSearchChange,
    onSubmit,
    selectedDifficulty,
    onDifficultyChange,
    selectedTopic,
    onTopicChange,
    sort,
    onSortChange,
    availableTopics = [],
    showDrafts,
    onToggleDrafts,
    isAdmin,
}) {
    const topicOptions = useMemo(() => {
        const topics = new Set(availableTopics);
        return Array.from(topics);
    }, [availableTopics]);

    return (
        <form
            onSubmit={onSubmit}
            className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/60 sm:p-6"
        >
            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Search problems
                    </label>
                    <TextInput
                        value={searchValue}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="e.g. Binary Search Tree"
                    />
                </div>
                <div className="flex min-w-0 flex-col gap-1 text-sm text-gray-500 dark:text-gray-400 sm:min-w-48 md:w-48">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Sort by</span>
                    <Select value={sort} onChange={(event) => onSortChange(event.target.value)}>
                        <option value="newest">Newest</option>
                        <option value="popular">Most attempted</option>
                        <option value="challenging">Most challenging</option>
                        <option value="oldest">Oldest</option>
                    </Select>
                </div>
            </div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-1 text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Difficulty</span>
                    <Select value={selectedDifficulty} onChange={(event) => onDifficultyChange(event.target.value)}>
                        <option value="all">All levels</option>
                        {defaultDifficulties.map((level) => (
                            <option key={level} value={level}>
                                {level}
                            </option>
                        ))}
                    </Select>
                </div>
                <div className="flex min-w-0 flex-col gap-1 text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Topic</span>
                    <Select value={selectedTopic} onChange={(event) => onTopicChange(event.target.value)}>
                        <option value="">All topics</option>
                        {topicOptions.map((topic) => (
                            <option key={topic} value={topic}>
                                {topic}
                            </option>
                        ))}
                    </Select>
                </div>
                {isAdmin && (
                    <div className="flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-xl bg-gray-100/80 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700/40 dark:text-gray-200 sm:col-span-2 lg:col-span-1">
                        <div className="min-w-0">
                            <span className="font-semibold">Include drafts</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Show unpublished problems</p>
                        </div>
                        <ToggleSwitch checked={showDrafts} onChange={onToggleDrafts} />
                    </div>
                )}
            </div>
            <div className="flex justify-stretch sm:justify-end">
                <Button type="submit" gradientDuoTone="cyanToBlue" className="min-h-11 w-full sm:w-auto">
                    Apply filters
                </Button>
            </div>
        </form>
    );
}
