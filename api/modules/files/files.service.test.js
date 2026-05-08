import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFolderTree, formatNode } from './files.service.js';

test('buildFolderTree nests children beneath their parent folders', () => {
    const folders = [
        { _id: 'root-a', name: 'Algorithms', parent: null, updatedAt: '2026-04-01' },
        { _id: 'child-a', name: 'Graphs', parent: 'root-a', updatedAt: '2026-04-02' },
        { _id: 'child-b', name: 'Trees', parent: 'root-a', updatedAt: '2026-04-03' },
    ];

    assert.deepEqual(buildFolderTree(folders), [
        {
            id: 'root-a',
            name: 'Algorithms',
            parentId: null,
            updatedAt: '2026-04-01',
            children: [
                {
                    id: 'child-a',
                    name: 'Graphs',
                    parentId: 'root-a',
                    updatedAt: '2026-04-02',
                    children: [],
                },
                {
                    id: 'child-b',
                    name: 'Trees',
                    parentId: 'root-a',
                    updatedAt: '2026-04-03',
                    children: [],
                },
            ],
        },
    ]);
});

test('formatNode exposes a stable client-facing file shape', () => {
    const node = formatNode({
        _id: 'file-1',
        name: 'spec.pdf',
        type: 'file',
        parent: 'folder-1',
        size: 2048,
        mimeType: 'application/pdf',
        extension: 'pdf',
        updatedAt: '2026-04-06',
        createdAt: '2026-04-05',
        storagePath: 'files/spec.pdf',
    });

    assert.equal(node.id, 'file-1');
    assert.equal(node.name, 'spec.pdf');
    assert.equal(node.parentId, 'folder-1');
    assert.equal(node.previewUrl, '/api/v1/files/file-1/download');
});
