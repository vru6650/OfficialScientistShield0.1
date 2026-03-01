import express from 'express';
import { z } from 'zod';
import { runJavaCode } from '../controllers/java.controller.js';
import { validateRequest } from '../utils/validate.js';
import { nonEmptyStringSchema } from '../validators/common.js';

const router = express.Router();

const runCodeBody = z.object({
    code: nonEmptyStringSchema,
});

router.post('/run-java', validateRequest({ body: runCodeBody }), runJavaCode);

export default router;
