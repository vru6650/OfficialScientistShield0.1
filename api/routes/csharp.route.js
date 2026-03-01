import express from 'express';
import { z } from 'zod';
import { runCSharpCode } from '../controllers/csharp.controller.js';
import { validateRequest } from '../utils/validate.js';
import { nonEmptyStringSchema } from '../validators/common.js';

const router = express.Router();

const runCodeBody = z.object({
    code: nonEmptyStringSchema,
});

router.post('/run-csharp', validateRequest({ body: runCodeBody }), runCSharpCode);

export default router;
