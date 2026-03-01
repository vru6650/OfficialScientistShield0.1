import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRunCppCode, missingCppCompilerMessage } from './cpp.controller.js';

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

test('runCppCode returns 400 when request body is missing', async () => {
    let receivedError;
    const res = createResponseDouble();
    const runCppCode = createRunCppCode({
        execFile: async () => {
            throw new Error('should not compile when body is missing');
        },
    });

    await runCppCode({}, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'C++ code is required.');
});

test('runCppCode returns 400 when code is not a string', async () => {
    let receivedError;
    const res = createResponseDouble();
    const runCppCode = createRunCppCode({
        execFile: async () => {
            throw new Error('should not compile when code is invalid');
        },
    });

    await runCppCode({ body: { code: 42 } }, res, (err) => {
        receivedError = err;
    });

    assert.ok(receivedError instanceof Error, 'expected an error to be forwarded to next');
    assert.equal(receivedError.statusCode, 400);
    assert.equal(receivedError.message, 'C++ code is required.');
});

test('runCppCode returns helpful message when compiler is unavailable', async () => {
    const writes = [];
    const removals = [];
    const execCalls = [];
    const tempDir = '/virtual-temp';

    const runCppCode = createRunCppCode({
        execFile: async (command, args) => {
            execCalls.push({ command, args });
            const error = new Error('spawn g++ ENOENT');
            error.code = 'ENOENT';
            throw error;
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
    await runCppCode({ body: { code: 'int main(){return 0;}' } }, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: missingCppCompilerMessage, error: true });
    assert.equal(execCalls.length, 1);
    assert.equal(execCalls[0].command, 'g++');
    assert.equal(writes.length, 1);
    assert.equal(removals.length, 1, 'expected workspace cleanup attempt');
});

test('runCppCode executes provided C++ and returns stdout', async () => {
    const writes = [];
    const removals = [];
    const execCalls = [];
    const tempDir = '/virtual-temp';

    const runCppCode = createRunCppCode({
        execFile: async (command, args, options) => {
            execCalls.push({ command, args, options });
            if (command === 'g++') {
                return { stdout: '' };
            }
            if (command.startsWith(tempDir)) {
                return { stdout: 'Hello from C++\n' };
            }
            throw new Error(`Unexpected command: ${command}`);
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
    await runCppCode(
        { body: { code: '#include <iostream>\nint main(){ std::cout << "Hello from C++"; }' } },
        res,
        () => {}
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { output: 'Hello from C++\n', error: false });
    assert.equal(execCalls.length, 2);
    assert.equal(execCalls[0].command, 'g++');
    assert.ok(execCalls[1].command.startsWith(tempDir));
    assert.equal(execCalls[1].args.length, 0);
    assert.equal(writes.length, 1);
    assert.equal(removals.length, 1, 'expected workspace cleanup attempt');
    assert.equal(
        execCalls[1].command,
        path.join(path.dirname(writes[0].filePath), 'main.out')
    );
});
