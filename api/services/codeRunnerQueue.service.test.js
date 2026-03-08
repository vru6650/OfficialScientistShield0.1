import test from 'node:test';
import assert from 'node:assert/strict';

import {
    enqueueCodeJob,
    shutdownCodeRunnerQueue,
    waitForCodeJob,
} from './codeRunnerQueue.service.js';

test('code runner queue executes JavaScript jobs in worker process', async () => {
    const queuedJob = enqueueCodeJob({
        language: 'javascript',
        code: "console.log('queued-worker')",
    });

    const completedJob = await waitForCodeJob(queuedJob.jobId, { timeoutMs: 12000 });

    try {
        assert.ok(completedJob, 'expected queued job to be available');
        assert.equal(completedJob.status, 'completed');
        assert.equal(completedJob.error, false);
        assert.match(completedJob.output, /queued-worker/);
    } finally {
        await shutdownCodeRunnerQueue();
    }
});
