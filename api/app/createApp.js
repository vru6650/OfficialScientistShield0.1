import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import {
    API_PREFIX,
    LEGACY_API_PREFIX,
    registerApiNotFound,
    registerApiRoutes,
} from './registerApiRoutes.js';

export const createApp = ({ corsOrigin }) => {
    const app = express();
    const __dirname = path.resolve();
    const clientDistDir = path.join(__dirname, 'client', 'dist');

    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
    });

    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use(compression());
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

    app.use(cors({
        origin: corsOrigin,
        credentials: true,
    }));

    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    app.use(cookieParser());

    app.use(API_PREFIX, apiLimiter);
    app.use(LEGACY_API_PREFIX, apiLimiter);

    registerApiRoutes(app, API_PREFIX);
    registerApiRoutes(app, LEGACY_API_PREFIX);
    registerApiNotFound(app, API_PREFIX);
    registerApiNotFound(app, LEGACY_API_PREFIX);

    app.use(express.static(clientDistDir));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }

        return res.sendFile(path.join(clientDistDir, 'index.html'));
    });

    app.use((err, req, res, next) => {
        console.error('SERVER ERROR:', err.stack);

        const statusCode = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';

        res.status(statusCode).json({
            success: false,
            statusCode,
            message,
        });
    });

    return app;
};
