import multer from 'multer';
import { FILE_UPLOAD_LIMIT_BYTES } from '../utils/fileManagerUtils.js';

const uploadLimitMb = Math.round(FILE_UPLOAD_LIMIT_BYTES / (1024 * 1024));

const multerErrorMessages = {
    LIMIT_FILE_COUNT: 'Too many files were uploaded.',
    LIMIT_FIELD_COUNT: 'Too many form fields were submitted.',
    LIMIT_FIELD_KEY: 'A form field name is too long.',
    LIMIT_FIELD_VALUE: 'A form field value is too large.',
    LIMIT_PART_COUNT: 'Too many multipart form parts were submitted.',
    LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload request.',
};

export const normalizeHttpError = (error) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return {
                statusCode: 413,
                message: `Uploaded file exceeds the ${uploadLimitMb} MB limit.`,
            };
        }

        return {
            statusCode: 400,
            message:
                multerErrorMessages[error.code] ||
                error.message ||
                'Invalid multipart upload request.',
        };
    }

    if (error?.type === 'entity.parse.failed') {
        return {
            statusCode: Number(error.statusCode || error.status || 400),
            message: 'Invalid JSON payload.',
        };
    }

    if (error?.type === 'entity.too.large') {
        return {
            statusCode: Number(error.statusCode || error.status || 413),
            message: 'Request body exceeds the allowed size limit.',
        };
    }

    const rawStatusCode = Number(error?.statusCode || error?.status || 500);
    const statusCode = Number.isInteger(rawStatusCode) && rawStatusCode >= 400 && rawStatusCode <= 599
        ? rawStatusCode
        : 500;
    const message =
        typeof error?.message === 'string' && error.message.trim().length > 0
            ? error.message
            : 'Internal Server Error';

    return {
        statusCode,
        message,
    };
};

export default normalizeHttpError;
