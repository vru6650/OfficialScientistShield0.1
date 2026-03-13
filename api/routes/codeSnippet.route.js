import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../utils/verifyUser.js';
import {
    createCodeSnippet,
    getCodeSnippet,
    updateCodeSnippet,
} from '../controllers/codeSnippet.controller.js';
import { requireAdmin } from '../utils/authorize.js';
import { validateRequest } from '../utils/validate.js';
import { objectIdSchema } from '../validators/common.js';

const router = express.Router();

const snippetIdParams = z.object({
    snippetId: objectIdSchema,
});

const createSnippetBody = z.object({}).passthrough();

router.post(
    '/create',
    verifyToken,
    requireAdmin('You are not allowed to create a code snippet'),
    validateRequest({ body: createSnippetBody }),
    createCodeSnippet
);
router.put(
    '/:snippetId',
    verifyToken,
    requireAdmin('You are not allowed to update a code snippet'),
    validateRequest({ params: snippetIdParams, body: createSnippetBody }),
    updateCodeSnippet
);
router.get('/:snippetId', validateRequest({ params: snippetIdParams }), getCodeSnippet);

export default router;
