import fileManagerRouter from '../../routes/fileManager.route.js';

export const fileModule = {
    name: 'files',
    register(app, prefix) {
        app.use(`${prefix}/files`, fileManagerRouter);
    },
};

export default fileModule;
