import { ZodError } from 'zod';
import { errorHandler } from './error.js';

const formatIssue = (issue) => {
    const path = issue.path?.length ? issue.path.join('.') : 'value';
    return `${path}: ${issue.message}`;
};

const formatZodError = (error) => error.issues.map(formatIssue).join('; ');

export const validateRequest = (schemas = {}) => (req, res, next) => {
    try {
        if (schemas.params) {
            const result = schemas.params.safeParse(req.params);
            if (!result.success) {
                throw result.error;
            }
            req.params = result.data;
        }

        if (schemas.query) {
            const result = schemas.query.safeParse(req.query);
            if (!result.success) {
                throw result.error;
            }
            req.query = result.data;
        }

        if (schemas.body) {
            const result = schemas.body.safeParse(req.body);
            if (!result.success) {
                throw result.error;
            }
            req.body = result.data;
        }

        return next();
    } catch (error) {
        if (error instanceof ZodError) {
            return next(errorHandler(400, `Validation error: ${formatZodError(error)}`));
        }
        return next(error);
    }
};
