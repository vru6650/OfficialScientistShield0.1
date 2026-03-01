import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunPythonCode, missingPythonRuntimeMessage } from './python.controller.js';

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

test('runPythonCode returns 400 when request body is missing', async () => {
    let receivedError;
    const res = createResponseDouble();
    const runPythonCode = createRunPythonCode({
        detectPython: async () => {
            throw new Error('should not reach runtime detection');
        },
    });

    await runPythonCode({}, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'Python code is required.');
});

test('runPythonCode returns 400 when code is not a string', async () => {
    let receivedError;
    const res = createResponseDouble();
    const runPythonCode = createRunPythonCode({
        detectPython: async () => {
            throw new Error('should not reach runtime detection');
        },
    });

    await runPythonCode({ body: { code: 123 } }, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'Python code is required.');
});

test('runPythonCode returns helpful message when python is unavailable', async () => {
    let mkdirCalled = false;
    const res = createResponseDouble();
    const runPythonCode = createRunPythonCode({
        detectPython: async () => null,
        fs: {
            promises: {
                mkdir: async () => {
                    mkdirCalled = true;
                },
            },
        },
    });

    await runPythonCode({ body: { code: 'print("hi")' } }, res, () => {});

    assert.equal(mkdirCalled, true, 'expected temporary directory to be created');
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: missingPythonRuntimeMessage, error: true });
});

test('runPythonCode executes provided Python and returns stdout', async () => {
    const writes = [];
    const removals = [];
    const execCalls = [];
    const tempDir = '/virtual-temp';

    const runPythonCode = createRunPythonCode({
        detectPython: async () => 'python3',
        execFile: async (command, args, options) => {
            execCalls.push({ command, args, options });
            return { stdout: 'Hello from Python\n' };
        },
        fs: {
            promises: {
                mkdir: async () => {},
                writeFile: async (filePath, content) => {
                    writes.push({ filePath, content });
                },
                rm: async (filePath, options) => {
                    removals.push({ filePath, options });
                },
            },
        },
        tempDir,
    });

    const res = createResponseDouble();
    await runPythonCode({ body: { code: 'print("Hello from Python")' } }, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: 'Hello from Python\n', error: false });
    assert.equal(execCalls.length, 1);
    assert.equal(execCalls[0].command, 'python3');
    assert.ok(execCalls[0].args[0].startsWith(`${tempDir}/`));
    assert.equal(writes.length, 1);
    assert.equal(removals.length, 1);
    assert.equal(writes[0].content, 'print("Hello from Python")');
    assert.equal(execCalls[0].args[0], writes[0].filePath);
});
