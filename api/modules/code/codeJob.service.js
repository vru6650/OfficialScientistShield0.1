import { errorHandler } from '../../utils/error.js';
import { getCodeExecutionHandler, normalizeCodeLanguage } from '../../services/codeRunnerJobExecutor.service.js';
import { enqueueCodeJob, getCodeJob, waitForCodeJob } from '../../services/codeRunnerQueue.service.js';

export const createCodeJob = async ({ language, code, waitForResult = true, timeoutMs }) => {
    const normalizedLanguage = normalizeCodeLanguage(language);
    const handler = getCodeExecutionHandler(normalizedLanguage);

    if (!handler) {
        throw errorHandler(400, 'Unsupported language. Use javascript, python, cpp, java, or csharp.');
    }

    if (typeof code !== 'string' || !code.trim()) {
        throw errorHandler(400, 'Code is required.');
    }

    const queuedJob = enqueueCodeJob({
        language: normalizedLanguage,
        code,
    });

    if (!waitForResult) {
        return queuedJob;
    }

    const completedJob = await waitForCodeJob(queuedJob.jobId, { timeoutMs });

    return completedJob || queuedJob;
};

export const getCodeJobById = ({ jobId }) => {
    const job = getCodeJob(jobId);

    if (!job) {
        throw errorHandler(404, 'Code execution job not found.');
    }

    return job;
};
