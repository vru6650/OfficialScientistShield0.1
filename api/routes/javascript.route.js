import express from 'express';
import { z } from 'zod';
import { runJavascriptCode } from '../controllers/javascript.controller.js';
import { validateRequest } from '../utils/validate.js';
import { nonEmptyStringSchema } from '../validators/common.js';

const router = express.Router();

const runCodeBody = z.object({
    code: nonEmptyStringSchema,
});

router.post('/run-js', validateRequest({ body: runCodeBody }), runJavascriptCode);

export default router;
