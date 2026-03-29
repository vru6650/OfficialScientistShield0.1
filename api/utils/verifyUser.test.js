import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

import { verifyToken } from './verifyUser.js';

const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;

test('verifyToken accepts a signed access_token cookie', () => {
    process.env.JWT_SECRET = 'test-secret';
    const token = jwt.sign({ id: 'user-1', isAdmin: false }, process.env.JWT_SECRET);
    const req = {
        cookies: { access_token: token },
        headers: {},
    };
    let nextCallCount = 0;

    verifyToken(req, {}, (error) => {
        nextCallCount += 1;
        assert.equal(error, undefined);
    });

    assert.equal(nextCallCount, 1);
    assert.equal(req.user.id, 'user-1');
});

test('verifyToken accepts a bearer token when cookie auth is absent', () => {
    process.env.JWT_SECRET = 'test-secret';
    const token = jwt.sign({ id: 'user-2', isAdmin: true }, process.env.JWT_SECRET);
    const req = {
        cookies: {},
        headers: {
            authorization: `Bearer ${token}`,
        },
    };
    let nextCallCount = 0;

    verifyToken(req, {}, (error) => {
        nextCallCount += 1;
        assert.equal(error, undefined);
    });

    assert.equal(nextCallCount, 1);
    assert.equal(req.user.id, 'user-2');
    assert.equal(req.user.isAdmin, true);
});

test('verifyToken accepts bearer tokens regardless of authorization scheme casing', () => {
    process.env.JWT_SECRET = 'test-secret';
    const token = jwt.sign({ id: 'user-3', isAdmin: false }, process.env.JWT_SECRET);
    const req = {
        cookies: {},
        headers: {
            authorization: `bearer   ${token}`,
        },
    };
    let nextCallCount = 0;

    verifyToken(req, {}, (error) => {
        nextCallCount += 1;
        assert.equal(error, undefined);
    });

    assert.equal(nextCallCount, 1);
    assert.equal(req.user.id, 'user-3');
});

test('verifyToken rejects requests without cookie or bearer token', () => {
    process.env.JWT_SECRET = 'test-secret';
    const req = {
        cookies: {},
        headers: {},
    };
    let capturedError = null;

    verifyToken(req, {}, (error) => {
        capturedError = error;
    });

    assert.equal(capturedError?.statusCode, 401);
    assert.equal(capturedError?.message, 'Unauthorized');
});

test.after(() => {
    if (ORIGINAL_JWT_SECRET === undefined) {
        delete process.env.JWT_SECRET;
        return;
    }

    process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
});
