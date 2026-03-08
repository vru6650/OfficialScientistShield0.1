import express from 'express';
import { z } from 'zod';
import { globalSearch, reindexSearchContent } from './search.controller.js';
import { verifyToken } from '../../utils/verifyUser.js';
import { requireAdmin } from '../../utils/authorize.js';
import { validateRequest } from '../../utils/validate.js';

const router = express.Router();

const searchQuerySchema = z
    .object({
        q: z.string().optional(),
        searchTerm: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        sort: z.enum(['recent', 'relevance']).optional(),
        types: z.string().optional(),
    })
    .partial();

router.get('/', validateRequest({ query: searchQuerySchema }), globalSearch);
router.post(
    '/reindex',
    verifyToken,
    requireAdmin('Only administrators can reindex search content.'),
    reindexSearchContent
);

export default router;
