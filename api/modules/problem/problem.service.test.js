import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildProblemQuery,
    mapProblemSummary,
    resolveProblemSort,
} from './problem.service.js';

test('buildProblemQuery excludes drafts for public listings and applies filters', () => {
    const filters = buildProblemQuery({
        difficulty: 'Medium',
        topic: 'graph',
        searchTerm: 'shortest path',
    }, false);

    assert.deepEqual(filters, {
        isPublished: true,
        difficulty: 'Medium',
        topics: {
            $regex: 'graph',
            $options: 'i',
        },
        $or: [
            { title: { $regex: 'shortest path', $options: 'i' } },
            { description: { $regex: 'shortest path', $options: 'i' } },
            { statement: { $regex: 'shortest path', $options: 'i' } },
        ],
    });
});

test('buildProblemQuery escapes regex metacharacters in public filters', () => {
    const filters = buildProblemQuery({
        topic: 'array[0]',
        tag: 'c++',
        company: 'A.B',
        searchTerm: '(graph)*',
    }, true);

    assert.deepEqual(filters, {
        topics: {
            $regex: 'array\\[0\\]',
            $options: 'i',
        },
        tags: {
            $regex: 'c\\+\\+',
            $options: 'i',
        },
        companies: {
            $regex: 'A\\.B',
            $options: 'i',
        },
        $or: [
            { title: { $regex: '\\(graph\\)\\*', $options: 'i' } },
            { description: { $regex: '\\(graph\\)\\*', $options: 'i' } },
            { statement: { $regex: '\\(graph\\)\\*', $options: 'i' } },
        ],
    });
});

test('mapProblemSummary computes success rate from aggregate stats', () => {
    const summary = mapProblemSummary({
        _id: 'problem-1',
        title: 'Binary Search',
        slug: 'binary-search',
        description: 'Find the target quickly.',
        difficulty: 'Easy',
        topics: ['arrays'],
        tags: ['search'],
        companies: ['Example'],
        estimatedTime: 15,
        stats: {
            submissions: 40,
            accepted: 10,
            likes: 7,
        },
        updatedAt: '2026-04-06T00:00:00.000Z',
        createdAt: '2026-04-05T00:00:00.000Z',
        isPublished: true,
    });

    assert.equal(summary.successRate, 25);
    assert.equal(summary.stats.likes, 7);
});

test('resolveProblemSort falls back to newest for unsupported values', () => {
    assert.deepEqual(resolveProblemSort('popular'), { 'stats.submissions': -1 });
    assert.deepEqual(resolveProblemSort('unknown'), { updatedAt: -1 });
});
