import http from 'http';
import { createApp } from './createApp.js';
import { connectDatabases } from '../infrastructure/persistence/index.js';
import { setupVisualizerSocket } from '../services/visualizerSocket.js';

export const startServer = async ({ mongoUri, postgresUri, corsOrigin, port }) => {
    await connectDatabases({ mongoUri, postgresUri });

    const app = createApp({ corsOrigin });
    const server = http.createServer(app);

    setupVisualizerSocket(server);

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Stop the existing process or set a different PORT.`);
            process.exit(1);
        }

        if (error.code === 'EACCES') {
            console.error(`Port ${port} requires elevated permissions. Use a higher port (for example, 3000).`);
            process.exit(1);
        }

        console.error('Failed to start HTTP server:', error);
        process.exit(1);
    });

    await new Promise((resolve) => {
        server.listen(port, () => {
            console.log(`Server is running on port ${port}!`);
            resolve();
        });
    });

    return { app, server };
};
