import quizRouter from './quiz.route.js';

export const quizModule = {
    name: 'quiz',
    register(app, prefix) {
        app.use(prefix, quizRouter);
    },
};

export default quizModule;
