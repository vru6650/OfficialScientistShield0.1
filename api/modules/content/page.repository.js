import Page from '../../models/page.model.js';

export const findPageBySlug = (slug) => {
    return Page.findOne({ slug });
};

export const findPageBySlugExcludingId = (slug, pageId) => {
    return Page.findOne({ slug, _id: { $ne: pageId } });
};

export const createPageRecord = (data) => {
    return Page.create(data);
};

export const findPages = ({ filters, startIndex, limit }) => {
    return Page.find(filters)
        .sort({ updatedAt: -1 })
        .skip(startIndex)
        .limit(limit)
        .lean();
};

export const countPages = (filters = {}) => {
    return Page.countDocuments(filters);
};

export const findPageById = (pageId, { lean = false } = {}) => {
    const query = Page.findById(pageId);
    if (lean) {
        query.lean();
    }
    return query;
};

export const findPublishedPageBySlug = (slug) => {
    return Page.findOne({ slug, status: 'published' }).lean();
};
