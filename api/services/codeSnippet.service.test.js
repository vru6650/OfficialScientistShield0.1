import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import CodeSnippet from '../models/CodeSnippet.model.js';
import { updateCodeSnippet } from './codeSnippet.service.js';

test('updateCodeSnippet rejects non-admin updates', async () => {
    await assert.rejects(
        updateCodeSnippet({
            snippetId: new mongoose.Types.ObjectId().toString(),
            body: { html: '<p>Denied</p>' },
            isAdmin: false,
        }),
        {
            statusCode: 403,
            message: 'You are not allowed to update a code snippet',
        }
    );
});

test('updateCodeSnippet only persists supported fields and coerces them to strings', async () => {
    const snippetId = new mongoose.Types.ObjectId().toString();
    const updatedSnippet = {
        _id: snippetId,
        html: '<section>Hello</section>',
        css: '',
        js: '',
        cpp: '42',
        python: '',
        java: '',
        csharp: '',
    };

    const findByIdAndUpdateMock = mock.method(
        CodeSnippet,
        'findByIdAndUpdate',
        async () => updatedSnippet
    );

    try {
        const result = await updateCodeSnippet({
            snippetId,
            body: {
                html: '<section>Hello</section>',
                cpp: 42,
                js: null,
                ignored: 'skip-me',
            },
            isAdmin: true,
        });

        assert.equal(findByIdAndUpdateMock.mock.callCount(), 1);

        const [calledSnippetId, updateFields, options] =
            findByIdAndUpdateMock.mock.calls[0].arguments;

        assert.equal(calledSnippetId, snippetId);
        assert.deepEqual(updateFields, {
            html: '<section>Hello</section>',
            cpp: '42',
            js: '',
        });
        assert.deepEqual(options, { new: true, runValidators: true });
        assert.equal(result, updatedSnippet);
    } finally {
        findByIdAndUpdateMock.mock.restore();
    }
});

test('updateCodeSnippet throws when the snippet does not exist', async () => {
    const findByIdAndUpdateMock = mock.method(
        CodeSnippet,
        'findByIdAndUpdate',
        async () => null
    );

    try {
        await assert.rejects(
            updateCodeSnippet({
                snippetId: new mongoose.Types.ObjectId().toString(),
                body: { html: '<p>Missing</p>' },
                isAdmin: true,
            }),
            {
                statusCode: 404,
                message: 'Code snippet not found.',
            }
        );
    } finally {
        findByIdAndUpdateMock.mock.restore();
    }
});
