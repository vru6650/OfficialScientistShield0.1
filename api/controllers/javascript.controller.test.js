import test from 'node:test';
import assert from 'node:assert/strict';
import { runJavascriptCode } from './javascript.controller.js';

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

test('runJavascriptCode returns 400 when request body is missing', async () => {
    let receivedError;
    const req = {};
    const res = createResponseDouble();

    await runJavascriptCode(req, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'JavaScript code is required.');
});

test('runJavascriptCode returns 400 when code is not a string', async () => {
    let receivedError;
    const req = { body: { code: 12345 } };
    const res = createResponseDouble();

    await runJavascriptCode(req, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'JavaScript code is required.');
});

test('runJavascriptCode executes provided JavaScript and returns stdout', async () => {
    const req = { body: { code: "console.log('Hello from tests!')" } };
    const res = createResponseDouble();
    let nextCalled = false;

    await runJavascriptCode(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false, 'next should not be called for successful execution');
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: 'Hello from tests!\n', error: false });
});

test('runJavascriptCode returns error payload without triggering global handler', async () => {
    const req = { body: { code: "console.log('before'); throw new Error('boom');" } };
    const res = createResponseDouble();
    let forwardedError;

    await runJavascriptCode(req, res, (err) => {
        forwardedError = err;
    });

    assert.equal(forwardedError, undefined, 'unexpected error forwarded to global handler');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.error, true);
    assert.match(res.body.output, /before/);
    assert.match(res.body.output, /boom/);
});
