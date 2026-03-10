import express from 'express';
import { z } from 'zod';
import { validateRequest } from '../../utils/validate.js';
import { verifyToken } from '../../utils/verifyUser.js';
import { requireAdmin } from '../../utils/authorize.js';
import {
    changeCommunitySubmissionStatus,
    listCommunitySubmissions,
    submitCommunityForm,
} from './community.controller.js';
import { objectIdSchema, paginationQuerySchema } from '../../validators/common.js';

const router = express.Router();

const createSubmissionBody = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().email('A valid email is required'),
    role: z.string().trim().min(1, 'Role is required'),
    experienceLevel: z.string().trim().min(1, 'Experience level is required'),
    goals: z.string().trim().optional(),
    interests: z.union([z.array(z.string().trim()), z.string().trim()]).optional(),
    message: z.string().trim().optional(),
    consentToContact: z.boolean().optional(),
    source: z.string().trim().optional(),
});

const listSubmissionsQuery = paginationQuerySchema.extend({
    status: z.enum(['new', 'reviewing', 'contacted', 'closed', 'all']).optional(),
    email: z.string().trim().min(1).optional(),
});

const updateStatusParams = z.object({
    submissionId: objectIdSchema,
});

const updateStatusBody = z.object({
    status: z.enum(['new', 'reviewing', 'contacted', 'closed']),
});

router.post(
    '/community-submissions',
    validateRequest({ body: createSubmissionBody }),
    submitCommunityForm
);

router.get(
    '/community-submissions',
    verifyToken,
    requireAdmin('Admin access required to view submissions'),
    validateRequest({ query: listSubmissionsQuery }),
    listCommunitySubmissions
);

router.patch(
    '/community-submissions/:submissionId/status',
    verifyToken,
    requireAdmin('Admin access required to update submissions'),
    validateRequest({ params: updateStatusParams, body: updateStatusBody }),
    changeCommunitySubmissionStatus
);

export default router;
