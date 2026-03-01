import {
    createPage as createPageService,
    deletePage as deletePageService,
    getPageById as getPageByIdService,
    getPages as getPagesService,
    getPublishedPageBySlug as getPublishedPageBySlugService,
    updatePage as updatePageService,
} from '../services/page.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createPage = asyncHandler(async (req, res) => {
    const page = await createPageService({
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(201).json(page);
});

export const getPages = asyncHandler(async (req, res) => {
    const data = await getPagesService({
        isAdmin: Boolean(req.user?.isAdmin),
        query: req.query,
    });
    res.status(200).json(data);
});

export const getPageById = asyncHandler(async (req, res) => {
    const page = await getPageByIdService({
        pageId: req.params.pageId,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json(page);
});

export const updatePage = asyncHandler(async (req, res) => {
    const page = await updatePageService({
        pageId: req.params.pageId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(200).json(page);
});

export const deletePage = asyncHandler(async (req, res) => {
    const data = await deletePageService({
        pageId: req.params.pageId,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json(data);
});

export const getPublishedPageBySlug = asyncHandler(async (req, res) => {
    const page = await getPublishedPageBySlugService({ slug: req.params.slug });
    res.status(200).json(page);
});
