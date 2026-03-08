import { loadEnv } from './config/env.js';
import { startServer } from './app/startServer.js';

const {
    MONGO_URI,
    POSTGRES_URI,
    CORS_ORIGIN,
    PORT,
} = loadEnv();

startServer({
    mongoUri: MONGO_URI,
    postgresUri: POSTGRES_URI,
    corsOrigin: CORS_ORIGIN,
    port: PORT,
}).catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
});
