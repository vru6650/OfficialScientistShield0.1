let postgresPool = null;

const isModuleMissing = (error) => {
    return error?.code === 'ERR_MODULE_NOT_FOUND' || String(error?.message || '').includes("Cannot find package 'pg'");
};

export const connectPostgres = async ({ postgresUri }) => {
    if (!postgresUri) {
        return null;
    }

    try {
        const pgModule = await import('pg');
        const Pool = pgModule?.Pool;

        if (!Pool) {
            throw new Error('pg Pool export is missing');
        }

        postgresPool = new Pool({ connectionString: postgresUri });
        await postgresPool.query('SELECT 1;');
        console.log('PostgreSQL connected');

        return postgresPool;
    } catch (error) {
        if (isModuleMissing(error)) {
            console.warn('POSTGRES_URI is set but the "pg" package is not installed. Skipping PostgreSQL connection.');
            return null;
        }

        console.error('Failed to connect PostgreSQL:', error);
        throw error;
    }
};

export const getPostgresPool = () => postgresPool;
