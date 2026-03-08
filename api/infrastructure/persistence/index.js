import { connectMongo } from './mongodb/mongo.client.js';
import { connectPostgres } from './postgresql/postgres.client.js';

export const connectDatabases = async ({ mongoUri, postgresUri }) => {
    await connectMongo({ mongoUri });
    await connectPostgres({ postgresUri });
};
