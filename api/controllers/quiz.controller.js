import {
    createQuiz as createQuizService,
    deleteQuiz as deleteQuizService,
    getQuizzes as getQuizzesService,
    getSingleQuizById as getSingleQuizByIdService,
    getSingleQuizBySlug as getSingleQuizBySlugService,
    submitQuiz as submitQuizService,
    updateQuiz as updateQuizService,
} from '../services/quiz.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createQuiz = asyncHandler(async (req, res) => {
    const savedQuiz = await createQuizService({
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(201).json(savedQuiz);
});

export const getQuizzes = asyncHandler(async (req, res) => {
    const data = await getQuizzesService({ query: req.query });
    res.status(200).json(data);
});

export const getSingleQuizById = asyncHandler(async (req, res) => {
    const quiz = await getSingleQuizByIdService({ quizId: req.params.quizId });
    res.status(200).json(quiz);
});

export const getSingleQuizBySlug = asyncHandler(async (req, res) => {
    const quiz = await getSingleQuizBySlugService({ quizSlug: req.params.quizSlug });
    res.status(200).json(quiz);
});

export const updateQuiz = asyncHandler(async (req, res) => {
    const updatedQuiz = await updateQuizService({
        quizId: req.params.quizId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(200).json(updatedQuiz);
});

export const deleteQuiz = asyncHandler(async (req, res) => {
    await deleteQuizService({
        quizId: req.params.quizId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json('The quiz has been deleted');
});

export const submitQuiz = asyncHandler(async (req, res) => {
    const data = await submitQuizService({
        quizId: req.params.quizId,
        answers: req.body.answers,
    });
    res.status(200).json(data);
});
