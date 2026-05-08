import fileManagerRouter from './files.route.js';

export const fileModule = {
    name: 'files',
    register(app, prefix) {
        app.use(`${prefix}/files`, fileManagerRouter);
    },
};

export default fileModule;
