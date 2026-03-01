import {
    createProblem as createProblemService,
    deleteProblem as deleteProblemService,
    getProblemById as getProblemByIdService,
    getProblemBySlug as getProblemBySlugService,
    getProblems as getProblemsService,
    updateProblem as updateProblemService,
} from '../services/problem.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createProblem = asyncHandler(async (req, res) => {
    const problem = await createProblemService({
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(201).json(problem);
});

export const getProblems = asyncHandler(async (req, res) => {
    const data = await getProblemsService({
        query: req.query,
        accessToken: req.cookies?.access_token,
    });
    res.status(200).json(data);
});

export const getProblemBySlug = asyncHandler(async (req, res) => {
    const problem = await getProblemBySlugService({
        problemSlug: req.params.problemSlug,
        accessToken: req.cookies?.access_token,
    });
    res.status(200).json(problem);
});

export const getProblemById = asyncHandler(async (req, res) => {
    const problem = await getProblemByIdService({
        problemId: req.params.problemId,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json(problem);
});

export const updateProblem = asyncHandler(async (req, res) => {
    const problem = await updateProblemService({
        problemId: req.params.problemId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(200).json(problem);
});

export const deleteProblem = asyncHandler(async (req, res) => {
    await deleteProblemService({
        problemId: req.params.problemId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json('The problem has been deleted');
});
