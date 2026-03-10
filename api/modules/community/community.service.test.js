import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCommunitySubmissionFilters } from './community.service.js';

test('buildCommunitySubmissionFilters supports partial email matching for dashboard filters', () => {
    const filters = buildCommunitySubmissionFilters({
        email: 'ada@',
        status: 'all',
    });

    assert.deepEqual(filters, {
        email: {
            $regex: 'ada@',
            $options: 'i',
        },
    });
});
