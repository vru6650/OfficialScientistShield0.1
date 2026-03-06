import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';

import router from './fileManager.route.js';

const getUploadValidationMiddleware = () => {
    const uploadRoute = router.stack.find(
        (layer) => layer.route?.path === '/upload' && layer.route?.methods?.post
    );

    assert.ok(uploadRoute, 'Expected /upload route to be registered');
    assert.ok(uploadRoute.route.stack.length >= 2, 'Expected upload validation middleware to exist');

    // Route order: multer upload handler -> upload body validator -> parent resolver -> controller
    return uploadRoute.route.stack[1].handle;
};

test('upload body validation deletes temp file when validation fails', async () => {
    const middleware = getUploadValidationMiddleware();
    const unlinkMock = mock.method(fs, 'unlink', async () => {});

    const req = {
        body: {
            parentId: 'invalid-object-id',
        },
        file: {
            path: '/tmp/invalid-upload-file.tmp',
        },
    };
    const res = {};

    let forwardedError;
    await new Promise((resolve) => {
        middleware(req, res, (error) => {
            forwardedError = error;
            resolve();
        });
    });

    try {
        assert.equal(unlinkMock.mock.callCount(), 1, 'temp upload should be cleaned up once');
        assert.equal(unlinkMock.mock.calls[0].arguments[0], req.file.path);
        assert.ok(forwardedError instanceof Error, 'validation error should be forwarded');
        assert.equal(forwardedError.statusCode, 400);
        assert.match(forwardedError.message, /validation error/i);
    } finally {
        unlinkMock.mock.restore();
    }
});
