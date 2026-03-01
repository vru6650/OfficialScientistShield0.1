// client/src/pages/UpdateQuiz.jsx
import { Alert, Button, Select, TextInput, Spinner, Textarea, Radio, Checkbox, Label } from 'flowbite-react';
import { useState, useReducer, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// CORRECT IMPORTS: Use the new, explicit function names
import { getSingleQuizById as getSingleQuizService, updateQuiz as updateQuizService } from '../services/quizService';
import { getTutorials as getTutorialsService } from '../services/tutorialService'; // To link quizzes to tutorials
import { FaTrash, FaPlus } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const quizInitialState = {
    formData: {
        title: '',
        description: '',
        category: 'uncategorized',
        questions: [],
        relatedTutorials: [],
    },
    publishError: null,
    loading: false,
};

function quizReducer(state, action) {
    switch (action.type) {
        case 'FIELD_CHANGE':
            return { ...state, formData: { ...state.formData, ...action.payload } };
        case 'SET_FORM_DATA':
            return { ...state, formData: action.payload };
        case 'ADD_QUESTION':
            return {
                ...state,
                formData: {
                    ...state.formData,
                    questions: [...state.formData.questions, {
                        questionText: '',
                        questionType: 'mcq',
                        options: [{ text: '', isCorrect: false }],
                        correctAnswer: '',
                        codeSnippet: '',
                        explanation: '',
                    }],
                },
            };
        case 'UPDATE_QUESTION_FIELD':
            return {
                ...state,
                formData: {
                    ...state.formData,
                    questions: state.formData.questions.map((q, qIndex) =>
                        qIndex === action.payload.qIndex
                            ? { ...q, [action.payload.field]: action.payload.value }
                            : q
                    ),
                },
            };
        case 'REMOVE_QUESTION':
            return {
                ...state,
                formData: {
                    ...state.formData,
                    questions: state.formData.questions.filter((_, qIndex) => qIndex !== action.payload.qIndex),
                },
            };
        case 'ADD_OPTION':
            return {
                ...state,
                formData: {
                    ...state.formData,
                    questions: state.formData.questions.map((q, qIndex) =>
                        qIndex === action.payload.qIndex
                            ? { ...q, options: [...q.options, { text: '', isCorrect: false }] }
                            : q
                    ),
                },
            };
        case 'UPDATE_OPTION':
            return {
                ...state,
                formData: {
                    ...state.formData,
                    questions: state.formData.questions.map((q, qIndex) =>
                        qIndex === action.payload.qIndex
                            ? {
                                ...q,
                                options: q.options.map((opt, optIndex) =>
                                    optIndex === action.payload.optIndex
                                        ? { ...opt, [action.payload.field]: action.payload.value }
                                        : opt
                                ),
                            }
                            : q
                    ),
                },
            };
        case 'REMOVE_OPTION':
            return {
                ...state,
                formData: {
                    ...state.formData,
                    questions: state.formData.questions.map((q, qIndex) =>
                        qIndex === action.payload.qIndex
                            ? { ...q, options: q.options.filter((_, optIndex) => optIndex !== action.payload.optIndex) }
                            : q
                    ),
                },
            };
        case 'UPDATE_START':
            return { ...state, loading: true, publishError: null };
        case 'UPDATE_SUCCESS':
            return { ...state, loading: false, publishError: null };
        case 'UPDATE_ERROR':
            return { ...state, loading: false, publishError: action.payload };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

const generateSlug = (text) => {
    if (!text) return '';
    return text.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');
};

export default function UpdateQuiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient(); // Add useQueryClient
    const [state, dispatch] = useReducer(quizReducer, quizInitialState);
    const { currentUser } = useSelector((state) => state.user);

    // Fetch existing quiz data
    const {
        isLoading: quizLoading,
        isError: quizIsError,
        error: quizError,
    } = useQuery({
        queryKey: ['quizToUpdate', quizId],
        // CORRECT FUNCTION CALL: Use getSingleQuizById
        queryFn: () => getSingleQuizService(quizId),
        enabled: !!quizId,
        onSuccess: (data) => {
            // Transform relatedTutorials from array of objects to array of IDs if needed
            const relatedTutorialIds = data.relatedTutorials ? data.relatedTutorials.map(t => t._id) : [];
            const questionsWithNormalizedIds = data.questions.map(q => ({
                ...q,
                _id: q._id.toString(), // Ensure _id is a string for consistent keying
                options: q.options.map(o => ({ ...o, _id: o._id.toString() }))
            }));

            dispatch({
                type: 'SET_FORM_DATA',
                payload: {
                    ...data,
                    questions: questionsWithNormalizedIds,
                    relatedTutorials: relatedTutorialIds,
                },
            });
        },
        onError: (err) => {
            dispatch({ type: 'UPDATE_ERROR', payload: err.message || 'Failed to load quiz for editing.' });
        },
    });


    // Fetch tutorials for linking
    const { data: tutorialsData } = useQuery({
        queryKey: ['allTutorials'],
        queryFn: () => getTutorialsService(''), // Fetch all tutorials
        staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    });
    const availableTutorials = tutorialsData?.tutorials || [];

    const updateQuizMutation = useMutation({
        mutationFn: updateQuizService,
        onSuccess: (data) => {
            dispatch({ type: 'UPDATE_SUCCESS' });
            // Invalidate the relevant queries to refetch the data on other pages
            queryClient.invalidateQueries({ queryKey: ['adminQuizzes'] });
            queryClient.invalidateQueries({ queryKey: ['quizToUpdate', quizId] });
            navigate(`/quizzes/${data.slug}`);
        },
        onError: (error) => {
            dispatch({ type: 'UPDATE_ERROR', payload: error.message || 'Failed to update quiz.' });
        },
    });

    const handleMainFieldChange = (e) => {
        const { id, value, selectedOptions } = e.target;
        if (id === 'relatedTutorials') {
            const selectedTutorialIds = Array.from(selectedOptions).map(option => option.value);
            dispatch({ type: 'FIELD_CHANGE', payload: { [id]: selectedTutorialIds } });
        } else {
            const payload = { [id]: value };
            if (id === 'title') {
                payload.slug = generateSlug(value);
            }
            dispatch({ type: 'FIELD_CHANGE', payload });
        }
    };

    const handleQuestionFieldChange = (qIndex, field, value) => {
        dispatch({ type: 'UPDATE_QUESTION_FIELD', payload: { qIndex, field, value } });
    };

    const handleOptionChange = (qIndex, optIndex, field, value) => {
        if (field === 'isCorrect' && value === true && state.formData.questions[qIndex].questionType === 'mcq') {
            // For MCQ, if a single correct answer is assumed, uncheck others
            dispatch({
                type: 'UPDATE_QUESTION_FIELD',
                payload: {
                    qIndex,
                    field: 'options',
                    value: state.formData.questions[qIndex].options.map((opt, i) =>
                        i === optIndex ? { ...opt, isCorrect: true } : { ...opt, isCorrect: false }
                    ),
                },
            });
        } else {
            dispatch({ type: 'UPDATE_OPTION', payload: { qIndex, optIndex, field, value } });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch({ type: 'UPDATE_START' });

        // Basic form validation (similar to CreateQuiz)
        if (!state.formData.title.trim()) {
            return dispatch({ type: 'UPDATE_ERROR', payload: 'Quiz title is required.' });
        }
        if (state.formData.questions.length === 0) {
            return dispatch({ type: 'UPDATE_ERROR', payload: 'Please add at least one question.' });
        }

        // Validate each question
        for (let i = 0; i < state.formData.questions.length; i++) {
            const q = state.formData.questions[i];
            if (!q.questionText.trim()) {
                return dispatch({ type: 'UPDATE_ERROR', payload: `Question ${i + 1}: Text is required.` });
            }

            if (q.questionType === 'mcq') {
                if (q.options.length < 2) {
                    return dispatch({ type: 'UPDATE_ERROR', payload: `Question ${i + 1}: Multiple choice questions need at least two options.` });
                }
                const hasCorrectOption = q.options.some(opt => opt.isCorrect);
                if (!hasCorrectOption) {
                    return dispatch({ type: 'UPDATE_ERROR', payload: `Question ${i + 1}: At least one correct option must be selected.` });
                }
                for (const opt of q.options) {
                    if (!opt.text.trim()) {
                        return dispatch({ type: 'UPDATE_ERROR', payload: `Question ${i + 1}: All options must have text.` });
                    }
                }
            } else if (q.questionType === 'fill-in-the-blank' || q.questionType === 'code-output') {
                if (!q.correctAnswer?.trim()) {
                    return dispatch({ type: 'UPDATE_ERROR', payload: `Question ${i + 1}: Correct answer is required for this question type.` });
                }
                if (q.questionType === 'code-output' && !q.codeSnippet?.trim()) {
                    return dispatch({ type: 'UPDATE_ERROR', payload: `Question ${i + 1}: Code snippet is required for code output questions.` });
                }
            }
        }

        updateQuizMutation.mutate({
            quizId,
            formData: state.formData
        });
    };

    if (quizLoading) {
        return (
            <div className='flex justify-center items-center min-h-screen'>
                <Spinner size='xl' />
            </div>
        );
    }

    if (quizIsError) {
        return (
            <Alert color='failure' className='mt-5'>
                Error loading quiz: {quizError?.message || 'Something went wrong while loading the quiz.'}
            </Alert>
        );
    }

    return (
        <div className='p-3 max-w-4xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200'>
            <h1 className='text-center text-4xl my-8 font-extrabold text-gray-900 dark:text-white'>Update Quiz</h1>
            <form className='flex flex-col gap-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg' onSubmit={handleSubmit}>
                {/* Main Quiz Details */}
                <div className='flex flex-col gap-5'>
                    <div>
                        <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Quiz Title</label>
                        <TextInput
                            type='text'
                            placeholder='e.g., JavaScript Fundamentals Quiz'
                            required
                            id='title'
                            value={state.formData.title}
                            onChange={handleMainFieldChange}
                            className='w-full'
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Description (Optional)</label>
                        <Textarea
                            placeholder='A brief description of this quiz...'
                            id='description'
                            value={state.formData.description}
                            onChange={handleMainFieldChange}
                            rows={3}
                            className='w-full'
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Category</label>
                        <Select id='category' onChange={handleMainFieldChange} value={state.formData.category} className='w-full'>
                            <option value='uncategorized'>Select a category</option>
                            <option value='javascript'>JavaScript</option>
                            <option value='reactjs'>React.js</option>
                            <option value='html'>HTML</option>
                            <option value='css'>CSS</option>
                            <option value='nodejs'>Node.js</option>
                            <option value='databases'>Databases</option>
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="relatedTutorials" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Related Tutorials (Optional)</label>
                        <Select
                            id="relatedTutorials"
                            multiple={true}
                            value={state.formData.relatedTutorials}
                            onChange={handleMainFieldChange}
                            className="w-full"
                            sizing="lg"
                        >
                            {availableTutorials.map(tutorial => (
                                <option key={tutorial._id} value={tutorial._id}>{tutorial.title}</option>
                            ))}
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                    </div>
                </div>

                {/* Questions Management */}
                <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">Questions</h2>
                {state.formData.questions.length === 0 && (
                    <Alert color="info">No questions added yet. Click "Add Question" to start building your quiz!</Alert>
                )}
                {state.formData.questions.map((question, qIndex) => (
                    <div key={question._id || `new-q-${qIndex}`} className="border border-blue-300 dark:border-blue-700 p-5 rounded-lg bg-blue-50 dark:bg-blue-900/10 relative mb-4 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">Question {qIndex + 1}</h3>
                            <Button
                                type="button"
                                color="red"
                                size="sm"
                                onClick={() => dispatch({ type: 'REMOVE_QUESTION', payload: { qIndex } })}
                                className="p-1"
                                title="Remove Question"
                            >
                                <FaTrash />
                            </Button>
                        </div>

                        <div className="mb-4">
                            <label htmlFor={`questionText-${qIndex}`} className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Question Text</label>
                            <Textarea
                                id={`questionText-${qIndex}`}
                                placeholder='Type your question here...'
                                required
                                value={question.questionText}
                                onChange={(e) => handleQuestionFieldChange(qIndex, 'questionText', e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor={`questionType-${qIndex}`} className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Question Type</label>
                            <Select
                                id={`questionType-${qIndex}`}
                                value={question.questionType}
                                onChange={(e) => handleQuestionFieldChange(qIndex, 'questionType', e.target.value)}
                            >
                                <option value="mcq">Multiple Choice</option>
                                <option value="fill-in-the-blank">Fill in the Blank</option>
                                <option value="code-output">Code Output (JS only)</option>
                            </Select>
                        </div>

                        {question.questionType === 'mcq' && (
                            <div className="mb-4 border border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-md">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Options</h4>
                                {question.options.map((option, optIndex) => (
                                    <div key={option._id || `new-opt-${optIndex}`} className="flex items-center gap-2 mb-2">
                                        <TextInput
                                            type="text"
                                            placeholder={`Option ${optIndex + 1}`}
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(qIndex, optIndex, 'text', e.target.value)}
                                            className="flex-grow"
                                        />
                                        <div className="flex items-center">
                                            <Checkbox
                                                id={`isCorrect-${qIndex}-${optIndex}`}
                                                checked={option.isCorrect}
                                                onChange={(e) => handleOptionChange(qIndex, optIndex, 'isCorrect', e.target.checked)}
                                            />
                                            <Label htmlFor={`isCorrect-${qIndex}-${optIndex}`} className="ml-1 text-sm text-gray-600 dark:text-gray-300">Correct</Label>
                                        </div>
                                        <Button
                                            type="button"
                                            size="xs"
                                            color="red"
                                            onClick={() => dispatch({ type: 'REMOVE_OPTION', payload: { qIndex, optIndex } })}
                                            className="p-1"
                                            disabled={question.options.length <= 1}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" size="sm" outline gradientDuoTone="greenToBlue" onClick={() => dispatch({ type: 'ADD_OPTION', payload: { qIndex } })} className="mt-2">
                                    Add Option
                                </Button>
                            </div>
                        )}

                        {question.questionType === 'fill-in-the-blank' && (
                            <div className="mb-4">
                                <label htmlFor={`correctAnswer-${qIndex}`} className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Correct Answer</label>
                                <TextInput
                                    id={`correctAnswer-${qIndex}`}
                                    placeholder='Expected answer for the blank'
                                    value={question.correctAnswer}
                                    onChange={(e) => handleQuestionFieldChange(qIndex, 'correctAnswer', e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {question.questionType === 'code-output' && (
                            <div className="mb-4">
                                <label htmlFor={`codeSnippet-${qIndex}`} className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Code Snippet (JavaScript)</label>
                                <Textarea
                                    id={`codeSnippet-${qIndex}`}
                                    placeholder='Paste JavaScript code here. The quiz will expect the console output.'
                                    value={question.codeSnippet}
                                    onChange={(e) => handleQuestionFieldChange(qIndex, 'codeSnippet', e.target.value)}
                                    rows={8}
                                    required
                                />
                                <label htmlFor={`correctAnswer-${qIndex}-code`} className="block mt-4 mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Expected Console Output</label>
                                <Textarea
                                    id={`correctAnswer-${qIndex}-code`}
                                    placeholder='Enter the exact expected output from the console.'
                                    value={question.correctAnswer}
                                    onChange={(e) => handleQuestionFieldChange(qIndex, 'correctAnswer', e.target.value)}
                                    rows={4}
                                    required
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label htmlFor={`explanation-${qIndex}`} className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Explanation (Optional)</label>
                            <Textarea
                                id={`explanation-${qIndex}`}
                                placeholder='Provide an explanation for the correct answer.'
                                value={question.explanation}
                                onChange={(e) => handleQuestionFieldChange(qIndex, 'explanation', e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                ))}
                <Button type="button" gradientDuoTone='cyanToBlue' outline onClick={() => dispatch({ type: 'ADD_QUESTION' })} className="w-fit self-end">
                    <FaPlus className="mr-2" /> Add New Question
                </Button>

                <Button type='submit' gradientDuoTone='purpleToPink' disabled={state.loading || updateQuizMutation.isPending} className="mt-8">
                    {state.loading || updateQuizMutation.isPending ? (<><Spinner size='sm' /><span className='pl-3'>Updating...</span></>) : 'Update Quiz'}
                </Button>
                {state.publishError && <Alert className='mt-5' color='failure'>{state.publishError}</Alert>}
            </form>
        </div>
    );
}
