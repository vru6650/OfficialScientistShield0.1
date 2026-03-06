import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import FileNode from '../models/fileNode.model.js';
import { updateNode } from './fileManager.service.js';

const createFindOneChain = (value) => ({
    collation() {
        return this;
    },
    async lean() {
        return value;
    },
});

test('updateNode rename does not move item when newParentId is omitted', async () => {
    const nodeId = new mongoose.Types.ObjectId();
    const parentId = new mongoose.Types.ObjectId();
    const now = new Date();

    const existingNode = {
        _id: nodeId,
        name: 'draft.txt',
        type: 'file',
        parent: parentId,
        ancestors: [],
        size: 128,
        mimeType: 'text/plain',
        extension: 'txt',
        updatedAt: now,
        createdAt: now,
        storagePath: `files/${nodeId.toString()}.txt`,
    };

    const parentNode = {
        _id: parentId,
        name: 'Documents',
        type: 'folder',
        parent: null,
        ancestors: [],
    };

    const renamedNode = {
        ...existingNode,
        name: 'renamed.txt',
    };

    const findByIdResponses = [existingNode, parentNode, renamedNode];
    const findByIdMock = mock.method(
        FileNode,
        'findById',
        async () => findByIdResponses.shift() ?? renamedNode
    );

    const findOneMock = mock.method(FileNode, 'findOne', () => createFindOneChain(null));
    const updateOneMock = mock.method(FileNode, 'updateOne', async () => ({ acknowledged: true }));

    try {
        const result = await updateNode({
            id: nodeId.toString(),
            name: 'renamed',
        });

        assert.equal(updateOneMock.mock.callCount(), 1, 'node should be updated once');
        assert.equal(findOneMock.mock.callCount(), 1, 'duplicate name check should run once');

        const updateArgs = updateOneMock.mock.calls[0].arguments;
        assert.equal(updateArgs[0]._id.toString(), nodeId.toString());
        assert.deepEqual(updateArgs[1], {
            $set: {
                name: 'renamed.txt',
            },
        });

        assert.equal(result.item.parentId.toString(), parentId.toString());
        assert.equal(result.item.name, 'renamed.txt');
    } finally {
        findByIdMock.mock.restore();
        findOneMock.mock.restore();
        updateOneMock.mock.restore();
    }
});
