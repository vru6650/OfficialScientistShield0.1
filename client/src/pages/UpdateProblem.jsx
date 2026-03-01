import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Label, Select, TextInput, Textarea, Spinner, ToggleSwitch } from 'flowbite-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FaPlus, FaTrash } from 'react-icons/fa';

import { getProblemById, updateProblem } from '../services/problemService';
import { useSelector } from 'react-redux';
import { STARTER_CODE_LIBRARY, getStarterTemplateById } from '../data/starterCodeLibrary';

const initialSample = { label: '', input: '', output: '', explanation: '' };
const initialHint = { title: '', body: '' };
const initialSnippet = { language: 'JavaScript', code: '', timeComplexity: '', spaceComplexity: '' };
const initialStarter = { language: 'JavaScript', code: '', notes: '' };
const initialResource = { label: '', url: '' };

const parseCommaSeparated = (value) =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const parseLineSeparated = (value) =>
    value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

const joinCommaSeparated = (values = []) => values.join(', ');
const joinLineSeparated = (values = []) => values.join('\n');

export default function UpdateProblem() {
    const { problemId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        statement: '',
        difficulty: 'Medium',
        topicsInput: '',
        tagsInput: '',
        companiesInput: '',
        inputFormat: '',
        outputFormat: '',
        constraintsInput: '',
        solutionApproach: '',
        editorial: '',
        estimatedTime: 45,
        isPublished: true,
    });

    const [samples, setSamples] = useState([initialSample]);
    const [hints, setHints] = useState([initialHint]);
    const [snippets, setSnippets] = useState([initialSnippet]);
    const [starterCodes, setStarterCodes] = useState([initialStarter]);
    const [resources, setResources] = useState([initialResource]);
    const [selectedStarterLibraryOption, setSelectedStarterLibraryOption] = useState('');

    const isBlankStarterTemplate = (template) => {
        if (!template) {
            return false;
        }

        const language = typeof template.language === 'string' ? template.language.trim() : '';
        const code = typeof template.code === 'string' ? template.code.trim() : '';
        const notes = typeof template.notes === 'string' ? template.notes.trim() : '';

        return !code && !notes && (!language || language === initialStarter.language);
    };

    const addStarterTemplateFromLibrary = (templateId) => {
        const libraryTemplate = getStarterTemplateById(templateId);

        if (!libraryTemplate) {
            setSelectedStarterLibraryOption('');
            return;
        }

        const preparedTemplate = {
            language: libraryTemplate.language,
            code: libraryTemplate.code,
            notes: libraryTemplate.notes ?? '',
        };

        setStarterCodes((prev) => {
            if (prev.length === 1 && isBlankStarterTemplate(prev[0])) {
                return [preparedTemplate];
            }

            return [...prev, preparedTemplate];
        });

        setSelectedStarterLibraryOption('');
    };

    const handleStarterTemplateSelect = (templateId) => {
        if (!templateId) {
            setSelectedStarterLibraryOption('');
            return;
        }

        setSelectedStarterLibraryOption(templateId);
        addStarterTemplateFromLibrary(templateId);
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['problem-edit', problemId],
        queryFn: () => getProblemById(problemId),
        enabled: Boolean(problemId),
    });

    useEffect(() => {
        if (!data) return;
        setFormData({
            title: data.title,
            description: data.description,
            statement: data.statement,
            difficulty: data.difficulty,
            topicsInput: joinCommaSeparated(data.topics),
            tagsInput: joinCommaSeparated(data.tags),
            companiesInput: joinCommaSeparated(data.companies),
            inputFormat: data.inputFormat ?? '',
            outputFormat: data.outputFormat ?? '',
            constraintsInput: joinLineSeparated(data.constraints),
            solutionApproach: data.solutionApproach ?? '',
            editorial: data.editorial ?? '',
            estimatedTime: data.estimatedTime ?? 0,
            isPublished: data.isPublished,
        });
        setSamples(data.samples?.length ? data.samples : [initialSample]);
        setHints(data.hints?.length ? data.hints : [initialHint]);
        setSnippets(data.solutionSnippets?.length ? data.solutionSnippets : [initialSnippet]);
        setStarterCodes(
            data.starterCodes?.length
                ? data.starterCodes.map((template) => ({
                    language: template.language ?? '',
                    code: template.code ?? '',
                    notes: template.notes ?? '',
                }))
                : [initialStarter]
        );
        setResources(data.resources?.length ? data.resources : [initialResource]);
    }, [data]);

    const mutation = useMutation({
        mutationFn: (payload) =>
            updateProblem({ problemId, payload }),
        onSuccess: (updated) => {
            navigate(`/problems/${updated.slug}`);
        },
    });

    const handleInputChange = (event) => {
        const { id, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value,
        }));
    };

    const updateArray = (setter) => (index, field, value) => {
        setter((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
    };

    const handleSampleChange = updateArray(setSamples);
    const handleHintChange = updateArray(setHints);
    const handleSnippetChange = updateArray(setSnippets);
    const handleStarterChange = updateArray(setStarterCodes);
    const handleResourceChange = updateArray(setResources);

    const handleSubmit = (event) => {
        event.preventDefault();
        const payload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            statement: formData.statement,
            difficulty: formData.difficulty,
            topics: parseCommaSeparated(formData.topicsInput),
            tags: parseCommaSeparated(formData.tagsInput),
            companies: parseCommaSeparated(formData.companiesInput),
            inputFormat: formData.inputFormat,
            outputFormat: formData.outputFormat,
            constraints: parseLineSeparated(formData.constraintsInput),
            samples: samples.filter((sample) => sample.input && sample.output),
            hints: hints.filter((hint) => hint.body),
            solutionApproach: formData.solutionApproach,
            editorial: formData.editorial,
            solutionSnippets: snippets.filter((snippet) => snippet.code),
            starterCodes: starterCodes
                .filter((template) => template.code)
                .map((template) => ({
                    ...template,
                    language: template.language.trim() || 'General',
                    notes: template.notes?.trim() ?? '',
                })),
            resources: resources.filter((resource) => resource.label && resource.url),
            estimatedTime: Number(formData.estimatedTime) || 0,
            isPublished: formData.isPublished,
        };

        mutation.mutate(payload);
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20">
                <Alert color="failure">{error?.message || 'Unable to load the problem for editing.'}</Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-10 px-4 py-12">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Update challenge</h1>
                <p className="text-gray-600 dark:text-gray-300">Refresh constraints, add new hints, or improve the editorial for this problem.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <section className="space-y-6 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <Label htmlFor="title" value="Problem title" />
                            <TextInput id="title" value={formData.title} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label htmlFor="difficulty" value="Difficulty" />
                            <Select id="difficulty" value={formData.difficulty} onChange={handleInputChange}>
                                <option>Beginner</option>
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                                <option>Advanced</option>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="estimatedTime" value="Estimated time (minutes)" />
                            <TextInput id="estimatedTime" type="number" min="0" value={formData.estimatedTime} onChange={handleInputChange} />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <ToggleSwitch
                                id="isPublished"
                                checked={formData.isPublished}
                                label="Published"
                                onChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        isPublished: value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="description" value="Short description" />
                        <Textarea id="description" rows={3} value={formData.description} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label htmlFor="statement" value="Problem statement" />
                        <Textarea id="statement" rows={8} value={formData.statement} onChange={handleInputChange} required />
                    </div>
                </section>

                <section className="grid gap-6 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900/70 md:grid-cols-2">
                    <div className="space-y-4">
                        <Label htmlFor="topicsInput" value="Topics (comma separated)" />
                        <TextInput id="topicsInput" value={formData.topicsInput} onChange={handleInputChange} />
                        <Label htmlFor="tagsInput" value="Techniques / tags (comma separated)" />
                        <TextInput id="tagsInput" value={formData.tagsInput} onChange={handleInputChange} />
                        <Label htmlFor="companiesInput" value="Companies (comma separated)" />
                        <TextInput id="companiesInput" value={formData.companiesInput} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="inputFormat" value="Input format" />
                        <Textarea id="inputFormat" rows={3} value={formData.inputFormat} onChange={handleInputChange} />
                        <Label htmlFor="outputFormat" value="Output format" />
                        <Textarea id="outputFormat" rows={3} value={formData.outputFormat} onChange={handleInputChange} />
                        <Label htmlFor="constraintsInput" value="Constraints (one per line)" />
                        <Textarea id="constraintsInput" rows={4} value={formData.constraintsInput} onChange={handleInputChange} />
                    </div>
                </section>

                <section className="space-y-4 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sample test cases</h2>
                        <Button type="button" size="xs" outline onClick={() => setSamples((prev) => [...prev, initialSample])}>
                            <FaPlus className="mr-2 h-3 w-3" /> Add sample
                        </Button>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {samples.map((sample, index) => (
                            <div key={index} className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <Label value={`Sample ${index + 1}`} />
                                    {samples.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setSamples((prev) => prev.filter((_, sampleIndex) => sampleIndex !== index))}
                                            className="text-sm text-red-500 hover:text-red-400"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                                <TextInput
                                    placeholder="Label"
                                    value={sample.label}
                                    onChange={(event) => handleSampleChange(index, 'label', event.target.value)}
                                />
                                <Textarea
                                    rows={3}
                                    placeholder="Input"
                                    value={sample.input}
                                    onChange={(event) => handleSampleChange(index, 'input', event.target.value)}
                                />
                                <Textarea
                                    rows={3}
                                    placeholder="Output"
                                    value={sample.output}
                                    onChange={(event) => handleSampleChange(index, 'output', event.target.value)}
                                />
                                <Textarea
                                    rows={2}
                                    placeholder="Explanation"
                                    value={sample.explanation}
                                    onChange={(event) => handleSampleChange(index, 'explanation', event.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Starter code templates</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Maintain language skeletons so solvers can jump straight into implementation, GeeksforGeeks style.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <div className="min-w-[220px]">
                                <Label htmlFor="starter-template-library-update" value="Add starter template" className="sr-only" />
                                <Select
                                    id="starter-template-library-update"
                                    value={selectedStarterLibraryOption}
                                    onChange={(event) => handleStarterTemplateSelect(event.target.value)}
                                >
                                    <option value="">Add language starter…</option>
                                    {STARTER_CODE_LIBRARY.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <Button type="button" size="xs" outline onClick={() => setStarterCodes((prev) => [...prev, initialStarter])}>
                                <FaPlus className="mr-2 h-3 w-3" /> Add blank template
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {starterCodes.map((template, index) => (
                            <div key={index} className="space-y-2 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                                <TextInput
                                    placeholder="Language"
                                    value={template.language}
                                    onChange={(event) => handleStarterChange(index, 'language', event.target.value)}
                                />
                                <Textarea
                                    rows={5}
                                    placeholder="Starter code"
                                    value={template.code}
                                    onChange={(event) => handleStarterChange(index, 'code', event.target.value)}
                                />
                                <Textarea
                                    rows={2}
                                    placeholder="Notes (optional)"
                                    value={template.notes ?? ''}
                                    onChange={(event) => handleStarterChange(index, 'notes', event.target.value)}
                                />
                                {starterCodes.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setStarterCodes((prev) => prev.filter((_, templateIndex) => templateIndex !== index))}
                                        className="text-sm text-red-500 hover:text-red-400"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hints &amp; editorial</h2>
                        <Button type="button" size="xs" outline onClick={() => setHints((prev) => [...prev, initialHint])}>
                            <FaPlus className="mr-2 h-3 w-3" /> Add hint
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {hints.map((hint, index) => (
                            <div key={index} className="space-y-2 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                                <TextInput
                                    placeholder="Hint title (optional)"
                                    value={hint.title}
                                    onChange={(event) => handleHintChange(index, 'title', event.target.value)}
                                />
                                <Textarea
                                    rows={3}
                                    placeholder="Hint body"
                                    value={hint.body}
                                    onChange={(event) => handleHintChange(index, 'body', event.target.value)}
                                />
                                {hints.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setHints((prev) => prev.filter((_, hintIndex) => hintIndex !== index))}
                                        className="text-sm text-red-500 hover:text-red-400"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="solutionApproach" value="Solution approach" />
                        <Textarea id="solutionApproach" rows={4} value={formData.solutionApproach} onChange={handleInputChange} />
                        <Label htmlFor="editorial" value="Editorial" />
                        <Textarea id="editorial" rows={6} value={formData.editorial} onChange={handleInputChange} />
                    </div>
                </section>

                <section className="space-y-4 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reference solutions</h2>
                        <Button type="button" size="xs" outline onClick={() => setSnippets((prev) => [...prev, initialSnippet])}>
                            <FaPlus className="mr-2 h-3 w-3" /> Add snippet
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {snippets.map((snippet, index) => (
                            <div key={index} className="space-y-2 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                                <TextInput
                                    placeholder="Language"
                                    value={snippet.language}
                                    onChange={(event) => handleSnippetChange(index, 'language', event.target.value)}
                                />
                                <Textarea
                                    rows={4}
                                    placeholder="Solution code"
                                    value={snippet.code}
                                    onChange={(event) => handleSnippetChange(index, 'code', event.target.value)}
                                />
                                <div className="grid gap-2 md:grid-cols-2">
                                    <TextInput
                                        placeholder="Time complexity"
                                        value={snippet.timeComplexity ?? ''}
                                        onChange={(event) => handleSnippetChange(index, 'timeComplexity', event.target.value)}
                                    />
                                    <TextInput
                                        placeholder="Space complexity"
                                        value={snippet.spaceComplexity ?? ''}
                                        onChange={(event) => handleSnippetChange(index, 'spaceComplexity', event.target.value)}
                                    />
                                </div>
                                {snippets.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setSnippets((prev) => prev.filter((_, snippetIndex) => snippetIndex !== index))}
                                        className="text-sm text-red-500 hover:text-red-400"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4 rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Helpful resources</h2>
                        <Button type="button" size="xs" outline onClick={() => setResources((prev) => [...prev, initialResource])}>
                            <FaPlus className="mr-2 h-3 w-3" /> Add link
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {resources.map((resource, index) => (
                            <div key={index} className="space-y-2 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                                <TextInput
                                    placeholder="Label"
                                    value={resource.label}
                                    onChange={(event) => handleResourceChange(index, 'label', event.target.value)}
                                />
                                <TextInput
                                    placeholder="https://"
                                    value={resource.url}
                                    onChange={(event) => handleResourceChange(index, 'url', event.target.value)}
                                />
                                {resources.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setResources((prev) => prev.filter((_, resourceIndex) => resourceIndex !== index))}
                                        className="text-sm text-red-500 hover:text-red-400"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {mutation.isError && (
                    <Alert color="failure">{mutation.error?.message || 'Failed to update the problem.'}</Alert>
                )}

                <div className="flex justify-end">
                    <Button type="submit" gradientDuoTone="purpleToBlue" isProcessing={mutation.isPending}>
                        Save changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
