import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunJavaCode } from './java.controller.js';

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

test('runJavaCode returns 400 when request body is missing', async () => {
    let receivedError;
    const req = {};
    const res = createResponseDouble();
    const runJavaCode = createRunJavaCode();

    await runJavaCode(req, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'Java code is required.');
});

test('runJavaCode returns 400 when code is not a string', async () => {
    let receivedError;
    const req = { body: { code: 12345 } };
    const res = createResponseDouble();
    const runJavaCode = createRunJavaCode();

    await runJavaCode(req, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'Java code is required.');
});

test('runJavaCode returns helpful message when javac is unavailable', async () => {
    const execCalls = [];
    const execStub = async (command) => {
        execCalls.push(command);
        const error = new Error('spawn javac ENOENT');
        error.code = 'ENOENT';
        throw error;
    };

    const runJavaCode = createRunJavaCode({ execFile: execStub });
    const req = { body: { code: 'public class Main { public static void main(String[] args) {} }' } };
    const res = createResponseDouble();

    await runJavaCode(req, res, () => {});

    assert.deepEqual(execCalls, ['javac']);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        output: 'Java runtime or compiler is not available. Please install a JDK to run Java code.',
        error: true,
    });
});

test('runJavaCode executes provided Java and returns stdout', async () => {
    const execCalls = [];
    const execStub = async (command) => {
        execCalls.push(command);
        if (command === 'javac') {
            return { stdout: '' };
        }
        if (command === 'java') {
            return { stdout: 'Hello from Java!\n' };
        }
        throw new Error(`Unexpected command: ${command}`);
    };

    const runJavaCode = createRunJavaCode({ execFile: execStub });
    const req = {
        body: {
            code: [
                'public class Main {',
                '    public static void main(String[] args) {',
                "        System.out.println(\"Hello from Java!\");",
                '    }',
                '}',
            ].join('\n'),
        },
    };
    const res = createResponseDouble();

    await runJavaCode(req, res, () => {});

    assert.deepEqual(execCalls, ['javac', 'java']);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: 'Hello from Java!\n', error: false });
});

test('runJavaCode normalizes Buffer outputs to strings', async () => {
    const execStub = async (command) => {
        if (command === 'javac') {
            return { stdout: Buffer.from('') };
        }
        if (command === 'java') {
            return { stdout: Buffer.from('Buffered Hello\n') };
        }
        throw new Error(`Unexpected command: ${command}`);
    };

    const runJavaCode = createRunJavaCode({ execFile: execStub });
    const req = { body: { code: 'public class Main { public static void main(String[] args) {} }' } };
    const res = createResponseDouble();

    await runJavaCode(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: 'Buffered Hello\n', error: false });
});
