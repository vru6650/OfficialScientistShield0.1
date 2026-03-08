import mongoose from 'mongoose';
import { errorHandler } from '../../utils/error.js';
import { generateSlug } from '../../utils/slug.js';
import { normalizePagination } from '../../utils/pagination.js';
import {
    countQuizzes,
    createQuizRecord,
    deleteQuizById,
    findQuizById,
    findQuizBySlug,
    findQuizzes,
    updateQuizById,
} from './quiz.repository.js';
import { saveQuizSubmission } from './quizSubmission.repository.js';

const isValidObjectId = mongoose.Types.ObjectId.isValid;

export const createQuiz = async ({ userId, isAdmin, body }) => {
    if (!isAdmin) {
        throw errorHandler(403, 'You are not allowed to create a quiz');
    }

    const { title, description, category, questions, relatedTutorials } = body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
        throw errorHandler(400, 'Please provide quiz title and at least one question.');
    }

    const slug = generateSlug(String(title));

    try {
        return await createQuizRecord({
            title,
            slug,
            description,
            category,
            questions,
            createdBy: userId,
            relatedTutorials,
        });
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A quiz with this ${field} already exists`);
        }
        throw error;
    }
};

export const getQuizzes = async ({ query }) => {
    if (query.quizId && !isValidObjectId(query.quizId)) {
        throw errorHandler(400, 'Invalid quizId');
    }

    if (query.relatedTutorialId && !isValidObjectId(query.relatedTutorialId)) {
        throw errorHandler(400, 'Invalid relatedTutorialId');
    }

    const { startIndex, limit } = normalizePagination(query, {
        defaultLimit: 9,
        maxLimit: 50,
    });
    const sortDirection = query.sort === 'asc' ? 1 : -1;

    const filters = {
        ...(query.quizId && { _id: query.quizId }),
        ...(query.slug && { slug: query.slug }),
        ...(query.category && { category: query.category }),
        ...(query.searchTerm && {
            $or: [
                { title: { $regex: query.searchTerm, $options: 'i' } },
                { description: { $regex: query.searchTerm, $options: 'i' } },
            ],
        }),
        ...(query.relatedTutorialId && { relatedTutorials: query.relatedTutorialId }),
    };

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [quizzes, totalQuizzes, lastMonthQuizzes] = await Promise.all([
        findQuizzes({ filters, sortDirection, startIndex, limit }),
        countQuizzes(filters),
        countQuizzes({
            ...filters,
            createdAt: { $gte: oneMonthAgo },
        }),
    ]);

    return { quizzes, totalQuizzes, lastMonthQuizzes };
};

export const getSingleQuizById = async ({ quizId }) => {
    if (!isValidObjectId(quizId)) {
        throw errorHandler(400, 'Invalid quiz id');
    }

    const quiz = await findQuizById(quizId, { withRelated: true });

    if (!quiz) {
        throw errorHandler(404, 'Quiz not found');
    }

    return quiz;
};

export const getSingleQuizBySlug = async ({ quizSlug }) => {
    const quiz = await findQuizBySlug(quizSlug);

    if (!quiz) {
        throw errorHandler(404, 'Quiz not found');
    }

    return quiz;
};

export const updateQuiz = async ({ quizId, userId, isAdmin, body }) => {
    if (!isValidObjectId(quizId)) {
        throw errorHandler(400, 'Invalid quiz id');
    }

    const quiz = await findQuizById(quizId);
    if (!quiz) {
        throw errorHandler(404, 'Quiz not found');
    }

    const requesterId = userId?.toString?.();
    const isOwner = requesterId && quiz.createdBy?.toString() === requesterId;
    if (!isAdmin && !isOwner) {
        throw errorHandler(403, 'You are not allowed to update this quiz');
    }

    const { title, description, category, questions, relatedTutorials } = body;
    const updateFields = {};

    if (typeof title === 'string') {
        updateFields.title = title;
        updateFields.slug = generateSlug(title);
    }
    if (description !== undefined) {
        updateFields.description = description;
    }
    if (category !== undefined) {
        updateFields.category = category;
    }
    if (questions !== undefined) {
        updateFields.questions = questions;
    }
    if (relatedTutorials !== undefined) {
        updateFields.relatedTutorials = relatedTutorials;
    }

    try {
        return await updateQuizById(quizId, updateFields);
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A quiz with this ${field} already exists`);
        }
        throw error;
    }
};

export const deleteQuiz = async ({ quizId, userId, isAdmin }) => {
    if (!isValidObjectId(quizId)) {
        throw errorHandler(400, 'Invalid quiz id');
    }

    const quiz = await findQuizById(quizId);
    if (!quiz) {
        throw errorHandler(404, 'Quiz not found');
    }

    const requesterId = userId?.toString?.();
    const isOwner = requesterId && quiz.createdBy?.toString() === requesterId;
    if (!isAdmin && !isOwner) {
        throw errorHandler(403, 'You are not allowed to delete this quiz');
    }

    await deleteQuizById(quizId);
};

export const submitQuiz = async ({ quizId, answers, userId }) => {
    if (!Array.isArray(answers)) {
        throw errorHandler(400, 'Answers must be an array.');
    }

    if (!isValidObjectId(quizId)) {
        throw errorHandler(400, 'Invalid quiz id');
    }

    const quiz = await findQuizById(quizId);
    if (!quiz) {
        throw errorHandler(404, 'Quiz not found.');
    }

    let correctCount = 0;
    const results = [];

    const answersById = new Map(
        answers
            .map((answer) => {
                const id = answer?.questionId ? String(answer.questionId) : null;
                return id ? [id, answer] : null;
            })
            .filter(Boolean)
    );

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    const validQuestions = questions
        .map((question) => ({
            question,
            questionId: question?._id?.toString?.() ?? '',
        }))
        .filter(({ questionId }) => Boolean(questionId));

    const totalQuestions = validQuestions.length;

    for (const { question, questionId } of validQuestions) {
        const submittedAnswer = answersById.get(questionId);
        const providedAnswer = submittedAnswer?.userAnswer;
        const providedAnswerText =
            providedAnswer === undefined || providedAnswer === null
                ? null
                : String(providedAnswer);

        const options = Array.isArray(question.options) ? question.options : [];
        const correctOptionTexts = options
            .filter((opt) => opt && opt.isCorrect)
            .map((opt) => (typeof opt.text === 'string' ? opt.text : String(opt.text)))
            .filter((text) => text !== undefined && text !== null);
        const rawCorrectAnswer = typeof question.correctAnswer === 'string' ? question.correctAnswer : '';
        const trimmedCorrectAnswer = rawCorrectAnswer.trim();
        const hasManualAnswer = trimmedCorrectAnswer.length > 0;

        let isCorrect = false;
        let feedback = '';
        let correctAnswerForResult = null;

        if (question.questionType === 'mcq') {
            const userSelectedTexts = Array.isArray(providedAnswer)
                ? providedAnswer
                    .filter((value) => value !== undefined && value !== null)
                    .map((value) => String(value))
                : providedAnswerText !== null
                    ? [providedAnswerText]
                    : [];

            const effectiveCorrectOptions = correctOptionTexts.length > 0
                ? correctOptionTexts
                : hasManualAnswer
                    ? [trimmedCorrectAnswer]
                    : [];
            const sortedCorrectOptions = [...effectiveCorrectOptions].map(String).sort();
            const sortedUserSelections = [...userSelectedTexts].sort();

            correctAnswerForResult = sortedCorrectOptions.length > 0 ? sortedCorrectOptions : [];

            if (!submittedAnswer) {
                feedback = sortedCorrectOptions.length
                    ? `No answer provided. Correct answer(s): ${sortedCorrectOptions.join(', ')}.`
                    : 'No answer provided.';
            } else if (sortedCorrectOptions.length === 0) {
                feedback = 'Correct options are not configured for this question yet.';
            } else if (
                sortedUserSelections.length === sortedCorrectOptions.length &&
                sortedUserSelections.every((val, i) => val === sortedCorrectOptions[i])
            ) {
                isCorrect = true;
                feedback = 'Correct!';
            } else {
                feedback = `Incorrect. Correct answer(s): ${sortedCorrectOptions.join(', ')}.`;
            }
        } else if (question.questionType === 'fill-in-the-blank') {
            correctAnswerForResult = hasManualAnswer ? trimmedCorrectAnswer : null;

            if (!submittedAnswer) {
                feedback = hasManualAnswer
                    ? `No answer provided. Expected: "${trimmedCorrectAnswer}".`
                    : 'No answer provided.';
            } else if (!hasManualAnswer) {
                feedback = 'Incorrect. This question is not configured with an expected answer yet.';
            } else if (
                typeof providedAnswer === 'string' &&
                providedAnswer.trim().toLowerCase() === trimmedCorrectAnswer.toLowerCase()
            ) {
                isCorrect = true;
                feedback = 'Correct!';
            } else {
                feedback = `Incorrect. Expected: "${trimmedCorrectAnswer}".`;
            }
        } else if (question.questionType === 'code-output') {
            correctAnswerForResult = hasManualAnswer ? rawCorrectAnswer : null;

            if (!submittedAnswer) {
                feedback = hasManualAnswer
                    ? `No output provided. Expected: \n"${rawCorrectAnswer}"`
                    : 'No output provided.';
            } else if (!hasManualAnswer) {
                feedback = 'Incorrect Output. This question is not configured with an expected output yet.';
            } else if (
                typeof providedAnswer === 'string' &&
                providedAnswer.trim() === trimmedCorrectAnswer
            ) {
                isCorrect = true;
                feedback = 'Correct Output!';
            } else {
                feedback = `Incorrect Output. Expected: \n"${rawCorrectAnswer}"\nYour output:\n"${providedAnswer ?? ''}"`;
            }
        } else {
            correctAnswerForResult = hasManualAnswer
                ? trimmedCorrectAnswer
                : correctOptionTexts.length > 0
                    ? correctOptionTexts
                    : null;

            if (!submittedAnswer) {
                feedback = hasManualAnswer
                    ? `No answer provided. Expected: "${trimmedCorrectAnswer}".`
                    : 'No answer provided.';
            }
        }

        if (isCorrect) {
            correctCount++;
        }

        results.push({
            questionId: question._id,
            questionText: question.questionText,
            userAnswer: providedAnswer ?? null,
            correctAnswer: correctAnswerForResult,
            isCorrect,
            explanation: question.explanation,
            feedback,
        });
    }

    const submissionData = {
        score: correctCount,
        totalQuestions,
        results,
        message: `You scored ${correctCount} out of ${totalQuestions}.`,
    };

    let persistedSubmission = null;

    try {
        persistedSubmission = await saveQuizSubmission({
            quizId,
            userId: userId?.toString?.() || null,
            score: submissionData.score,
            totalQuestions: submissionData.totalQuestions,
            answers,
            results: submissionData.results,
            message: submissionData.message,
        });
    } catch (error) {
        console.warn('Failed to persist quiz submission in PostgreSQL:', error.message);
    }

    return {
        ...submissionData,
        persistedInPostgres: Boolean(persistedSubmission),
        submissionId: persistedSubmission?.id ?? null,
    };
};
