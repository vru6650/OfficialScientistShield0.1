import express from 'express';
import { z } from 'zod';
import { google, signin, signup } from './auth.controller.js';
import { validateRequest } from '../../utils/validate.js';
import { nonEmptyStringSchema } from '../../validators/common.js';

const router = express.Router();

const signupSchema = z.object({
    username: nonEmptyStringSchema,
    email: nonEmptyStringSchema,
    password: nonEmptyStringSchema,
});

const signinSchema = z.object({
    email: nonEmptyStringSchema,
    password: nonEmptyStringSchema,
});

const googleSchema = z.object({
    email: nonEmptyStringSchema,
    name: nonEmptyStringSchema,
    googlePhotoUrl: z.string().trim().optional(),
});

router.post('/signup', validateRequest({ body: signupSchema }), signup);
router.post('/signin', validateRequest({ body: signinSchema }), signin);
router.post('/google', validateRequest({ body: googleSchema }), google);

export default router;
