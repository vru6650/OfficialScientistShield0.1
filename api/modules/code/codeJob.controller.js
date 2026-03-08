import { asyncHandler } from '../../utils/asyncHandler.js';
import { createCodeJob, getCodeJobById } from './codeJob.service.js';

export const enqueueJob = asyncHandler(async (req, res) => {
    const job = await createCodeJob({
        language: req.body.language,
        code: req.body.code,
        waitForResult: req.body.waitForResult !== false,
        timeoutMs: req.body.timeoutMs,
    });

    const httpStatus = job.status === 'completed' || job.status === 'failed' ? 200 : 202;

    res.status(httpStatus).json(job);
});

export const getJob = asyncHandler(async (req, res) => {
    const job = getCodeJobById({ jobId: req.params.jobId });
    const httpStatus = job.status === 'completed' || job.status === 'failed' ? 200 : 202;

    res.status(httpStatus).json(job);
});
