import express from 'express';
import { z } from 'zod';
import { enqueueJob, getJob } from './codeJob.controller.js';
import { validateRequest } from '../../utils/validate.js';
import { nonEmptyStringSchema } from '../../validators/common.js';

const router = express.Router();

const createJobBody = z.object({
    language: nonEmptyStringSchema,
    code: nonEmptyStringSchema,
    waitForResult: z.boolean().optional(),
    timeoutMs: z.coerce.number().int().min(500).max(60000).optional(),
});

const jobParams = z.object({
    jobId: z.string().uuid(),
});

router.post('/jobs', validateRequest({ body: createJobBody }), enqueueJob);
router.get('/jobs/:jobId', validateRequest({ params: jobParams }), getJob);

export default router;
