import {
    globalSearch as globalSearchService,
    reindexSearchContent as reindexSearchContentService,
} from '../services/searchQuery.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const globalSearch = asyncHandler(async (req, res) => {
    const data = await globalSearchService({ query: req.query });
    res.status(200).json(data);
});

export const reindexSearchContent = asyncHandler(async (req, res) => {
    const data = await reindexSearchContentService({ isAdmin: Boolean(req.user?.isAdmin) });
    res.status(200).json(data);
});
