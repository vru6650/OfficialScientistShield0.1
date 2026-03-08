import { executeCodeJob } from '../services/codeRunnerJobExecutor.service.js';

const sendMessage = (message) => {
    if (typeof process.send === 'function') {
        process.send(message);
    }
};

sendMessage({ type: 'ready' });

process.on('message', async (message) => {
    if (!message || message.type !== 'run') {
        return;
    }

    const { jobId, payload } = message;

    try {
        const result = await executeCodeJob(payload || {});
        sendMessage({ type: 'result', jobId, result });
    } catch (error) {
        sendMessage({
            type: 'result',
            jobId,
            result: {
                output: error?.message || 'Code execution failed.',
                error: true,
                statusCode: error?.statusCode || 500,
            },
        });
    }
});
