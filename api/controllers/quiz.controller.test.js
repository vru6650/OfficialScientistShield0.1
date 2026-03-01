import test from 'node:test';
import assert from 'node:assert/strict';

import { createQuiz, submitQuiz } from './quiz.controller.js';
import Quiz from '../models/quiz.model.js';
import { errorHandler } from '../utils/error.js';

const mockResponse = () => {
    const res = {};
    res.status = function status() {
        return this;
    };
    res.json = function json() {
        return this;
    };
    return res;
};

test('createQuiz returns 400 error when questions are missing', async () => {
    const req = {
        user: { isAdmin: true, id: 'user-id' },
        body: { title: 'Sample Quiz' },
    };
    const res = mockResponse();

    let nextCalledWith;
    const next = (err) => {
        nextCalledWith = err;
    };

    await createQuiz(req, res, next);

    assert.ok(nextCalledWith instanceof Error, 'Expected next to be called with an error');
    assert.equal(nextCalledWith.statusCode, 400);
    assert.equal(
        nextCalledWith.message,
        'Please provide quiz title and at least one question.'
    );
});

test('createQuiz returns 400 error when questions array is empty', async () => {
    const req = {
        user: { isAdmin: true, id: 'user-id' },
        body: { title: 'Sample Quiz', questions: [] },
    };
    const res = mockResponse();

    let nextCalledWith;
    const next = (err) => {
        nextCalledWith = err;
    };

    await createQuiz(req, res, next);

    assert.ok(nextCalledWith instanceof Error, 'Expected next to be called with an error');
    assert.equal(nextCalledWith.statusCode, 400);
    assert.equal(
        nextCalledWith.message,
        'Please provide quiz title and at least one question.'
    );
});

test('submitQuiz ignores questions without ids when scoring', async () => {
    const originalFindById = Quiz.findById;

    const questions = [
        {
            _id: 'q1',
            questionType: 'mcq',
            questionText: 'Pick A',
            options: [{ text: 'A', isCorrect: true }],
            explanation: 'A is correct',
        },
        {
            // Intentionally missing _id to mimic malformed data
            questionType: 'mcq',
            questionText: 'Pick B',
            options: [{ text: 'B', isCorrect: true }],
        },
    ];
    questions.id = (id) => questions.find((item) => String(item._id) === String(id));

    Quiz.findById = () => Promise.resolve({ questions });

    const req = {
        params: { quizId: '507f1f77bcf86cd799439011' },
        body: { answers: [{ questionId: 'q1', userAnswer: 'A' }] },
    };
    const res = createResponseDouble();

    let forwardedError;
    try {
        await submitQuiz(req, res, (err) => {
            forwardedError = err;
        });
    } finally {
        Quiz.findById = originalFindById;
    }

    assert.equal(forwardedError, undefined);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.totalQuestions, 1, 'should only count questions with ids');
    assert.equal(res.payload.score, 1, 'should score based on counted questions');
});

const createResponseDouble = () => {
    return {
        statusCode: 0,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.payload = data;
            return this;
        },
    };
};

test('submitQuiz returns correct answers for fill-in-the-blank questions without options array', async () => {
    const originalFindById = Quiz.findById;

    const question = {
        _id: 'question-1',
        questionType: 'fill-in-the-blank',
        questionText: 'Name the JavaScript runtime used by Node.js.',
        correctAnswer: undefined,
        explanation: 'Node.js uses the V8 engine under the hood.',
    };

    const questions = [question];
    questions.id = (id) => questions.find((item) => String(item._id) === String(id));

    Quiz.findById = () => Promise.resolve({
        questions,
    });

    const req = {
        params: { quizId: '507f191e810c19729de860ea' },
        body: {
            answers: [
                {
                    questionId: 'question-1',
                    userAnswer: 'v8',
                },
            ],
        },
    };
    const res = createResponseDouble();

    let forwardedError;
    try {
        await submitQuiz(req, res, (err) => {
            forwardedError = err;
        });
    } finally {
        Quiz.findById = originalFindById;
    }

    assert.strictEqual(forwardedError, undefined);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.payload, 'Expected response payload to be set');
    assert.strictEqual(res.payload.score, 0);
    assert.strictEqual(res.payload.totalQuestions, 1);
    assert.deepEqual(res.payload.results[0].correctAnswer, null);
    assert.strictEqual(res.payload.results[0].isCorrect, false);
    assert.match(res.payload.results[0].feedback, /not configured/i);
});
