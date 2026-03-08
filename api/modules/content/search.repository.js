import {
    globalSearch as globalSearchService,
    reindexSearchContent as reindexSearchContentService,
} from '../../services/searchQuery.service.js';

export const runGlobalSearch = ({ query }) => {
    return globalSearchService({ query });
};

export const runReindexSearch = ({ isAdmin }) => {
    return reindexSearchContentService({ isAdmin });
};
