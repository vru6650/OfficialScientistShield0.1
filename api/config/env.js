import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    MONGO_URI: z.string().trim().min(1, 'MONGO_URI is required'),
    POSTGRES_URI: z.string().trim().optional().default(''),
    CORS_ORIGIN: z.string().trim().optional().default('http://localhost:5173'),
    PORT: z
        .string()
        .trim()
        .regex(/^\d+$/, 'PORT must be a number')
        .default('3000'),
    JWT_SECRET: z.string().trim().optional(),
    NODE_ENV: z.string().trim().optional().default('development'),
});

const parseCorsOrigins = (corsOrigin) =>
    corsOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

const normalizePort = (value) => {
    const port = Number(value);

    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error('PORT must be an integer between 1 and 65535');
    }

    return port;
};

export const loadEnv = () => {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join('; ');
        throw new Error(`Invalid environment configuration: ${message}`);
    }

    const env = parsed.data;

    if (!env.JWT_SECRET) {
        if (env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET is required in production');
        }
        console.warn('JWT_SECRET is not set. Falling back to a non-secure default for development only.');
        env.JWT_SECRET = 'viren';
    }

    const corsOrigins = parseCorsOrigins(env.CORS_ORIGIN);
    const port = normalizePort(env.PORT);

    process.env.MONGO_URI = env.MONGO_URI;
    process.env.POSTGRES_URI = env.POSTGRES_URI;
    process.env.CORS_ORIGIN = env.CORS_ORIGIN;
    process.env.PORT = String(port);
    process.env.JWT_SECRET = env.JWT_SECRET;
    process.env.NODE_ENV = env.NODE_ENV;

    return {
        MONGO_URI: env.MONGO_URI,
        POSTGRES_URI: env.POSTGRES_URI,
        CORS_ORIGIN: corsOrigins.length ? corsOrigins : [env.CORS_ORIGIN],
        PORT: port,
        JWT_SECRET: env.JWT_SECRET,
    };
};
