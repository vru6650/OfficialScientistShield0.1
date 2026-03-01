import express from 'express';
import { z } from 'zod';
import { runCppCode } from '../controllers/cpp.controller.js';
import { validateRequest } from '../utils/validate.js';
import { nonEmptyStringSchema } from '../validators/common.js';

const router = express.Router();

const runCodeBody = z.object({
    code: nonEmptyStringSchema,
});

router.post('/run-cpp', validateRequest({ body: runCodeBody }), runCppCode);

export default router;
