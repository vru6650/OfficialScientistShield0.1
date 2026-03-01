import express from 'express';
import { z } from 'zod';
import {
    createPage,
    deletePage,
    getPageById,
    getPages,
    getPublishedPageBySlug,
    updatePage,
} from '../controllers/page.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { requireAdmin } from '../utils/authorize.js';
import { validateRequest } from '../utils/validate.js';
import { nonEmptyStringSchema, objectIdSchema, paginationQuerySchema, slugSchema } from '../validators/common.js';

const router = express.Router();

const pageIdParams = z.object({
    pageId: objectIdSchema,
});

const createPageBody = z
    .object({
        title: nonEmptyStringSchema,
        slug: z.string().optional(),
        description: z.string().optional(),
        sections: z.array(z.any()).optional(),
        status: z.string().optional(),
        seo: z.object({}).passthrough().optional(),
    })
    .passthrough();

const updatePageBody = z
    .object({
        title: nonEmptyStringSchema,
        slug: z.string().optional(),
        description: z.string().optional(),
        sections: z.array(z.any()).optional(),
        status: z.string().optional(),
        seo: z.object({}).passthrough().optional(),
    })
    .passthrough();

const getPagesQuery = paginationQuerySchema.extend({
    status: z.string().optional(),
    searchTerm: z.string().optional(),
}).partial();

const slugParams = z.object({
    slug: slugSchema,
});

router.post(
    '/pages',
    verifyToken,
    requireAdmin('Only administrators can create content pages.'),
    validateRequest({ body: createPageBody }),
    createPage
);
router.get(
    '/pages',
    verifyToken,
    requireAdmin('Only administrators can view content pages.'),
    validateRequest({ query: getPagesQuery }),
    getPages
);
router.get(
    '/pages/:pageId',
    verifyToken,
    requireAdmin('Only administrators can view content pages.'),
    validateRequest({ params: pageIdParams }),
    getPageById
);
router.patch(
    '/pages/:pageId',
    verifyToken,
    requireAdmin('Only administrators can update content pages.'),
    validateRequest({ params: pageIdParams, body: updatePageBody }),
    updatePage
);
router.delete(
    '/pages/:pageId',
    verifyToken,
    requireAdmin('Only administrators can delete content pages.'),
    validateRequest({ params: pageIdParams }),
    deletePage
);

router.get(
    '/content/:slug',
    validateRequest({ params: slugParams }),
    getPublishedPageBySlug
);

export default router;
