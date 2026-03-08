import { runGlobalSearch, runReindexSearch } from './search.repository.js';

export const globalSearch = ({ query }) => {
    return runGlobalSearch({ query });
};

export const reindexSearchContent = ({ isAdmin }) => {
    return runReindexSearch({ isAdmin });
};
