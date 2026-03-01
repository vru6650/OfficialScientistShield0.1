import test from 'node:test';
import assert from 'node:assert/strict';
import Tutorial from '../models/tutorial.model.js';
import { markChapterAsComplete } from './tutorial.controller.js';

const createResponseDouble = () => {
    const response = {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
    return response;
};

const originalFindById = Tutorial.findById;

const restoreFindById = () => {
    Tutorial.findById = originalFindById;
};

test('markChapterAsComplete records the current user once', async () => {
    const chapter = { _id: 'chapter-1', completedBy: [] };
    let saved = false;
    const tutorial = {
        chapters: {
            id: (id) => (id === 'chapter-1' ? chapter : null),
        },
        async save() {
            saved = true;
        },
    };

    Tutorial.findById = async (id) => (id === 'tutorial-1' ? tutorial : null);

    const req = {
        params: { tutorialId: 'tutorial-1', chapterId: 'chapter-1' },
        user: { id: 'user-123' },
    };
    const res = createResponseDouble();

    try {
        await markChapterAsComplete(req, res, () => {});
    } finally {
        restoreFindById();
    }

    assert.equal(res.statusCode, 200);
    assert.equal(saved, true, 'tutorial.save should be called');
    assert.deepEqual(chapter.completedBy.map(String), ['user-123']);
    assert.equal(res.body?.message, 'Chapter marked as complete.');
});

test('markChapterAsComplete detects existing completions stored as ObjectIds', async () => {
    const existingId = { toString: () => 'user-123' };
    const chapter = { _id: 'chapter-1', completedBy: [existingId] };
    const tutorial = {
        chapters: {
            id: (id) => (id === 'chapter-1' ? chapter : null),
        },
        async save() {
            throw new Error('save should not be called when already completed');
        },
    };

    Tutorial.findById = async () => tutorial;

    const req = {
        params: { tutorialId: 'tutorial-1', chapterId: 'chapter-1' },
        user: { id: 'user-123' },
    };
    const res = createResponseDouble();
    let receivedError;

    try {
        await markChapterAsComplete(req, res, (err) => {
            receivedError = err;
        });
    } finally {
        restoreFindById();
    }

    assert.ok(receivedError instanceof Error, 'expected error to be forwarded');
    assert.equal(receivedError.statusCode, 400);
    assert.deepEqual(chapter.completedBy.map((id) => id.toString?.() ?? id), ['user-123']);
});
