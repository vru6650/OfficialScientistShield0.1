import { errorHandler } from './error.js';

const DEFAULT_AUTH_MESSAGE = 'Authentication required';
const DEFAULT_FORBIDDEN_MESSAGE = 'You are not allowed to perform this action';

export const requireAuth = (message = DEFAULT_AUTH_MESSAGE) => (req, res, next) => {
    if (!req.user?.id) {
        return next(errorHandler(401, message));
    }
    return next();
};

export const requireAdmin = (message = 'Admin access required') => (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(errorHandler(403, message));
    }
    return next();
};

export const requireSelf = (
    paramName = 'userId',
    message = DEFAULT_FORBIDDEN_MESSAGE,
) => (req, res, next) => {
    const requesterId = req.user?.id;
    if (!requesterId) {
        return next(errorHandler(401, DEFAULT_AUTH_MESSAGE));
    }

    if (req.params?.[paramName] !== requesterId) {
        return next(errorHandler(403, message));
    }

    return next();
};

export const requireSelfOrAdmin = (
    paramName = 'userId',
    message = DEFAULT_FORBIDDEN_MESSAGE,
) => (req, res, next) => {
    const requesterId = req.user?.id;
    if (!requesterId) {
        return next(errorHandler(401, DEFAULT_AUTH_MESSAGE));
    }

    if (!req.user?.isAdmin && req.params?.[paramName] !== requesterId) {
        return next(errorHandler(403, message));
    }

    return next();
};
