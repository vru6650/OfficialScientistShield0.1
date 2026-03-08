import userRouter from './user.route.js';

export const userModule = {
    name: 'user',
    register(app, prefix) {
        app.use(`${prefix}/user`, userRouter);
    },
};

export default userModule;
