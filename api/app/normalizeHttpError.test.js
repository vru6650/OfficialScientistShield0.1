import test from 'node:test';
import assert from 'node:assert/strict';
import multer from 'multer';

import { errorHandler } from '../utils/error.js';
import { FILE_UPLOAD_LIMIT_BYTES } from '../utils/fileManagerUtils.js';
import { normalizeHttpError } from './normalizeHttpError.js';

test('normalizeHttpError preserves explicit application errors', () => {
    const error = errorHandler(404, 'Problem not found.');

    assert.deepEqual(normalizeHttpError(error), {
        statusCode: 404,
        message: 'Problem not found.',
    });
});

test('normalizeHttpError converts invalid JSON body parser errors to a 400 response', () => {
    const error = new SyntaxError('Unexpected token } in JSON');
    error.status = 400;
    error.type = 'entity.parse.failed';

    assert.deepEqual(normalizeHttpError(error), {
        statusCode: 400,
        message: 'Invalid JSON payload.',
    });
});

test('normalizeHttpError converts oversized request body errors to a 413 response', () => {
    const error = new Error('request entity too large');
    error.status = 413;
    error.type = 'entity.too.large';

    assert.deepEqual(normalizeHttpError(error), {
        statusCode: 413,
        message: 'Request body exceeds the allowed size limit.',
    });
});

test('normalizeHttpError converts multer file size errors to a 413 response', () => {
    const error = new multer.MulterError('LIMIT_FILE_SIZE');
    const uploadLimitMb = Math.round(FILE_UPLOAD_LIMIT_BYTES / (1024 * 1024));

    assert.deepEqual(normalizeHttpError(error), {
        statusCode: 413,
        message: `Uploaded file exceeds the ${uploadLimitMb} MB limit.`,
    });
});

test('normalizeHttpError converts unexpected multer file errors to a 400 response', () => {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');

    assert.deepEqual(normalizeHttpError(error), {
        statusCode: 400,
        message: 'Unexpected file field in upload request.',
    });
});

test('normalizeHttpError coerces invalid explicit status codes to 500', () => {
    const error = errorHandler(200, 'This should not be successful');

    assert.deepEqual(normalizeHttpError(error), {
        statusCode: 500,
        message: 'This should not be successful',
    });
});
