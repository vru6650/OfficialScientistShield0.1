// api/index.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import commentRoutes from './routes/comment.route.js';
import tutorialRoutes from './routes/tutorial.route.js';
import quizRoutes from './routes/quiz.route.js';
import codeSnippetRoutes from './routes/codeSnippet.route.js';
import cppRoutes from './routes/cpp.route.js';
import pythonRoutes from './routes/python.route.js';
import javascriptRoutes from './routes/javascript.route.js';
import javaRoutes from './routes/java.route.js';
import csharpRoutes from './routes/csharp.route.js';
import pageRoutes from './routes/page.route.js';
import problemRoutes from './routes/problem.route.js';
import searchRoutes from './routes/search.route.js';
import fileManagerRoutes from './routes/fileManager.route.js';

import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import { setupVisualizerSocket } from './services/visualizerSocket.js';

dotenv.config();

// Provide sensible defaults for optional environment variables so the
// development server can start without a custom .env file. Only the JWT
// secret is required for authentication to work correctly.
let {
    MONGO_URI = 'mongodb://0.0.0.0:27017/myappp',
    CORS_ORIGIN = 'http://localhost:5173',
    PORT = '3000',
    JWT_SECRET,
} = process.env;

if (!JWT_SECRET) {
    console.warn(
        'JWT_SECRET is not set. Falling back to a non-secure default. Set JWT_SECRET in production environments.'
    );
    JWT_SECRET = 'viren';
}

process.env.MONGO_URI = MONGO_URI;
process.env.CORS_ORIGIN = CORS_ORIGIN;
process.env.PORT = PORT;
process.env.JWT_SECRET = JWT_SECRET;

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('db');
    })
    .catch((err) => {
        console.log(err);
    });

const __dirname = path.resolve();
const CLIENT_DIST_DIR = path.join(__dirname, 'client', 'dist');

const app = express();

const server = http.createServer(app);

app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

setupVisualizerSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
});

const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;
const LEGACY_API_PREFIX = '/api';

const registerApiRoutes = (prefix) => {
    app.use(`${prefix}/user`, userRoutes);
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/post`, postRoutes);
    app.use(`${prefix}/comment`, commentRoutes);
    app.use(`${prefix}/tutorial`, tutorialRoutes);
    app.use(`${prefix}/code-snippet`, codeSnippetRoutes);
    app.use(prefix, quizRoutes);
    app.use(prefix, problemRoutes);
    app.use(`${prefix}/code`, cppRoutes);
    app.use(`${prefix}/code`, pythonRoutes);
    app.use(`${prefix}/code`, javascriptRoutes);
    app.use(`${prefix}/code`, javaRoutes);
    app.use(`${prefix}/code`, csharpRoutes);
    app.use(prefix, pageRoutes);
    app.use(`${prefix}/search`, searchRoutes);
    app.use(`${prefix}/files`, fileManagerRoutes);
};

const registerApiNotFound = (prefix) => {
    app.use(prefix, (req, res) => {
        res.status(404).json({
            success: false,
            statusCode: 404,
            message: 'API route not found',
            path: req.originalUrl,
        });
    });
};

registerApiRoutes(API_PREFIX);
registerApiRoutes(LEGACY_API_PREFIX);
registerApiNotFound(API_PREFIX);
registerApiNotFound(LEGACY_API_PREFIX);

// Serve the built client assets. Avoid an absolute "/client/dist" path, which
// would point to the filesystem root instead of this project directory.
app.use(express.static(CLIENT_DIST_DIR));

// Only serve the SPA for non-API GET requests; let API 404s fall through
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(CLIENT_DIST_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
    // ==========================================================
    // UPDATED: Log the full stack trace to the server console
    // ==========================================================
    console.error('SERVER ERROR:', err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});
