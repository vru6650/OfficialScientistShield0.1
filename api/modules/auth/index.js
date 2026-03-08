import authRouter from './auth.route.js';

export const authModule = {
    name: 'auth',
    register(app, prefix) {
        app.use(`${prefix}/auth`, authRouter);
    },
};

export default authModule;
