import problemRouter from '../../routes/problem.route.js';

export const problemModule = {
    name: 'problem',
    register(app, prefix) {
        app.use(prefix, problemRouter);
    },
};

export default problemModule;
