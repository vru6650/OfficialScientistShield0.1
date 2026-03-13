import {
    createCodeSnippet as createCodeSnippetService,
    getCodeSnippet as getCodeSnippetService,
    updateCodeSnippet as updateCodeSnippetService,
} from '../services/codeSnippet.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Creates a new code snippet.
 */
export const createCodeSnippet = asyncHandler(async (req, res) => {
    const savedSnippet = await createCodeSnippetService({
        body: req.body,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(201).json(savedSnippet);
});

/**
 * Gets a code snippet by its ID.
 */
export const getCodeSnippet = asyncHandler(async (req, res) => {
    const snippet = await getCodeSnippetService({ snippetId: req.params.snippetId });
    res.status(200).json(snippet);
});

export const updateCodeSnippet = asyncHandler(async (req, res) => {
    const snippet = await updateCodeSnippetService({
        snippetId: req.params.snippetId,
        body: req.body,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json(snippet);
});
