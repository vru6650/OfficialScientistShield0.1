// client/src/components/QuizComponent.jsx
import { useQuery, useMutation } from '@tanstack/react-query';
// CORRECT IMPORTS: Using the new, explicit function name
import { getSingleQuizById, submitQuiz } from '../services/quizService';
import { Spinner, Alert, Button, Radio, Label, Checkbox, TextInput } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { HiCheckCircle, HiXCircle, HiInformationCircle } from 'react-icons/hi';
import { FaCode } from 'react-icons/fa'; // For code-output questions

export default function QuizComponent({ quizId }) {
    const { currentUser } = useSelector((state) => state.user);
    const [userAnswers, setUserAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [quizResult, setQuizResult] = useState(null);

    const { data: quiz, isLoading, isError, error } = useQuery({
        queryKey: ['quiz', quizId],
        // CORRECT FUNCTION CALL: Use the ID-specific fetcher
        queryFn: () => getSingleQuizById(quizId),
        enabled: !!quizId, // Only fetch if quizId is available
        staleTime: Infinity, // Quizzes are static, so cache indefinitely
    });

    const submitMutation = useMutation({
        mutationFn: (answers) => submitQuiz(quizId, answers),
        onSuccess: (data) => {
            setQuizResult(data);
            setSubmitted(true);
        },
        onError: (err) => {
            console.error('Quiz submission failed:', err);
            setQuizResult({ error: err.message || 'Failed to submit quiz.' });
        },
    });

    useEffect(() => {
        // Reset state when quizId changes or component is mounted fresh
        setUserAnswers({});
        setSubmitted(false);
        setQuizResult(null);
    }, [quizId]);

    if (isLoading) {
        return (
            <div className='flex justify-center items-center p-8'>
                <Spinner size='xl' />
            </div>
        );
    }

    if (isError) {
        return (
            <Alert color='failure'>
                Error loading quiz: {error?.message || 'Quiz not found or failed to load.'}
            </Alert>
        );
    }

    if (!quiz) {
        return <Alert color='warning'>Quiz not available.</Alert>;
    }

    const handleAnswerChange = (questionId, value) => {
        setUserAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('Please sign in to submit the quiz.');
            return;
        }

        const answersArray = Object.keys(userAnswers).map((qId) => ({
            questionId: qId,
            userAnswer: userAnswers[qId],
        }));

        submitMutation.mutate(answersArray);
    };

    const getAnswerFeedback = (questionId) => {
        if (!submitted || !quizResult || !quizResult.results) return null;
        return quizResult.results.find(res => res.questionId === questionId);
    };

    const renderQuestion = (question, index) => {
        const feedback = getAnswerFeedback(question._id);
        const isCorrect = feedback?.isCorrect;
        const feedbackClass = submitted ? (isCorrect ? 'text-green-500' : 'text-red-500') : '';
        const FeedbackIcon = submitted ? (isCorrect ? HiCheckCircle : HiXCircle) : null;

        return (
            <div key={question._id} className="mb-6 min-w-0 rounded-lg border bg-gray-100 p-4 shadow-sm dark:bg-gray-700">
                <p className="mb-3 flex min-w-0 flex-wrap items-center gap-1 text-lg font-semibold">
                    {index + 1}. {question.questionText} {FeedbackIcon && <FeedbackIcon className="ml-2 text-xl" />}
                </p>

                {question.questionType === 'mcq' && (
                    <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex min-w-0 items-start gap-2">
                                {Array.isArray(question.options.filter(o => o.isCorrect)) && question.options.filter(o => o.isCorrect).length > 1 ? (
                                    // Render checkboxes if multiple correct answers are possible
                                    <Checkbox
                                        id={`mcq-${question._id}-${optIndex}`}
                                        name={`mcq-${question._id}`}
                                        value={option.text}
                                        onChange={(e) => {
                                            const currentAnswers = userAnswers[question._id] || [];
                                            let newAnswers;
                                            if (e.target.checked) {
                                                newAnswers = [...currentAnswers, e.target.value];
                                            } else {
                                                newAnswers = currentAnswers.filter(ans => ans !== e.target.value);
                                            }
                                            handleAnswerChange(question._id, newAnswers);
                                        }}
                                        checked={userAnswers[question._id]?.includes(option.text) || false}
                                        disabled={submitted}
                                        className={submitted && option.isCorrect ? 'checked:bg-green-500' : ''}
                                    />
                                ) : (
                                    // Render radio buttons for single correct answer
                                    <Radio
                                        id={`mcq-${question._id}-${optIndex}`}
                                        name={`mcq-${question._id}`}
                                        value={option.text}
                                        onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                                        checked={userAnswers[question._id] === option.text}
                                        disabled={submitted}
                                        className={submitted && option.isCorrect ? 'checked:bg-green-500' : ''}
                                    />
                                )}
                                <Label htmlFor={`mcq-${question._id}-${optIndex}`} className={`min-w-0 cursor-pointer break-words ${submitted && option.isCorrect ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                    {option.text}
                                </Label>
                            </div>
                        ))}
                    </div>
                )}

                {question.questionType === 'fill-in-the-blank' && (
                    <TextInput
                        placeholder="Your answer"
                        value={userAnswers[question._id] || ''}
                        onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                        disabled={submitted}
                        className={submitted && isCorrect ? 'border-green-500' : submitted && !isCorrect ? 'border-red-500' : ''}
                    />
                )}

                {question.questionType === 'code-output' && (
                    <div className="flex flex-col gap-2">
                        <p className="font-medium flex items-center gap-1"><FaCode /> Code:</p>
                        <pre className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto text-sm">
                            <code>{question.codeSnippet}</code>
                        </pre>
                        <TextInput
                            placeholder="Enter the expected output"
                            value={userAnswers[question._id] || ''}
                            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                            disabled={submitted}
                            className={submitted && isCorrect ? 'border-green-500' : submitted && !isCorrect ? 'border-red-500' : ''}
                        />
                    </div>
                )}

                {submitted && feedback && (
                    <div className="mt-4 text-sm">
                        <p className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {isCorrect ? 'Correct!' : 'Incorrect.'} {feedback.feedback}
                        </p>
                        {feedback.explanation && (
                            <p className="text-gray-600 dark:text-gray-300 italic mt-1">
                                Explanation: {feedback.explanation}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="quiz-container min-w-0 rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800 sm:p-5">
            <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-900 dark:text-white">
                {quiz.title}
            </h2>
            {quiz.description && <p className="text-center text-gray-600 dark:text-gray-300 mb-8">{quiz.description}</p>}

            <form onSubmit={handleSubmit}>
                {quiz.questions.map(renderQuestion)}

                {!submitted && (
                    <Button
                        type="submit"
                        gradientDuoTone='cyanToBlue'
                        className="mt-6 w-full"
                        disabled={submitMutation.isPending || Object.keys(userAnswers).length !== quiz.questions.length}
                    >
                        {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                )}
            </form>

            {quizResult && quizResult.error && (
                <Alert color='failure' className='mt-5'>
                    {quizResult.error}
                </Alert>
            )}

            {submitted && quizResult && !quizResult.error && (
                <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center shadow-inner">
                    <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-3">Quiz Results</h3>
                    <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        You scored {quizResult.score} out of {quizResult.totalQuestions}!
                    </p>
                    <p className="text-gray-700 dark:text-gray-200 mt-2">
                        {quizResult.message}
                    </p>
                    <Button
                        className="mt-5"
                        gradientDuoTone='purpleToPink'
                        onClick={() => {
                            setSubmitted(false);
                            setUserAnswers({});
                            setQuizResult(null);
                        }}
                    >
                        Retake Quiz
                    </Button>
                </div>
            )}
        </div>
    );
}
