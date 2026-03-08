import test from 'node:test';
import assert from 'node:assert/strict';

import { createCodeJob } from './codeJob.service.js';
import { shutdownCodeRunnerQueue } from '../../services/codeRunnerQueue.service.js';

test('createCodeJob with waitForResult returns sanitized job payload', async () => {
    try {
        const job = await createCodeJob({
            language: 'javascript',
            code: "console.log('service-test')",
            waitForResult: true,
            timeoutMs: 12000,
        });

        assert.equal(job.status, 'completed');
        assert.equal(job.error, false);
        assert.match(job.output, /service-test/);
        assert.equal('code' in job, false, 'job response should not expose source code');
    } finally {
        await shutdownCodeRunnerQueue();
    }
});

test('createCodeJob rejects unsupported languages', async () => {
    await assert.rejects(
        createCodeJob({
            language: 'ruby',
            code: 'puts :hi',
        }),
        (error) => error?.statusCode === 400
    );
});
