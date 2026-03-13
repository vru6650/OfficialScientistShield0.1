import CodeSnippet from '../models/CodeSnippet.model.js';
import { errorHandler } from '../utils/error.js';

export const createCodeSnippet = async ({ body, isAdmin }) => {
    if (!isAdmin) {
        throw errorHandler(403, 'You are not allowed to create a code snippet');
    }

    const {
        html = '',
        css = '',
        js = '',
        cpp = '',
        python = '',
        java = '',
        csharp = '',
    } = body;

    const newSnippet = new CodeSnippet({ html, css, js, cpp, python, java, csharp });
    const savedSnippet = await newSnippet.save();
    return savedSnippet;
};

export const getCodeSnippet = async ({ snippetId }) => {
    const snippet = await CodeSnippet.findById(snippetId);
    if (!snippet) {
        throw errorHandler(404, 'Code snippet not found.');
    }
    return snippet;
};

export const updateCodeSnippet = async ({ snippetId, body, isAdmin }) => {
    if (!isAdmin) {
        throw errorHandler(403, 'You are not allowed to update a code snippet');
    }

    const updateFields = {};
    const snippetFields = ['html', 'css', 'js', 'cpp', 'python', 'java', 'csharp'];

    snippetFields.forEach((field) => {
        if (body?.[field] !== undefined) {
            updateFields[field] = String(body[field] ?? '');
        }
    });

    const snippet = await CodeSnippet.findByIdAndUpdate(
        snippetId,
        updateFields,
        { new: true, runValidators: true }
    );

    if (!snippet) {
        throw errorHandler(404, 'Code snippet not found.');
    }

    return snippet;
};
