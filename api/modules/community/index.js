import communityRouter from './community.route.js';

export const communityModule = {
    name: 'community',
    register(app, prefix) {
        app.use(prefix, communityRouter);
    },
};

export default communityModule;
