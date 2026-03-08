import { registerDomainModules } from '../modules/index.js';

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;
export const LEGACY_API_PREFIX = '/api';

export const registerApiRoutes = (app, prefix) => {
    registerDomainModules(app, prefix);
};

export const registerApiNotFound = (app, prefix) => {
    app.use(prefix, (req, res) => {
        res.status(404).json({
            success: false,
            statusCode: 404,
            message: 'API route not found',
            path: req.originalUrl,
        });
    });
};
