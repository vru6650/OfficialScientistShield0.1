import tutorialRouter from './tutorial.route.js';
import postRouter from './post.route.js';
import commentRouter from './comment.route.js';
import pageRouter from './page.route.js';
import searchRouter from './search.route.js';
import codeSnippetRouter from '../../routes/codeSnippet.route.js';

export const contentModule = {
    name: 'content',
    register(app, prefix) {
        app.use(`${prefix}/tutorial`, tutorialRouter);
        app.use(`${prefix}/post`, postRouter);
        app.use(`${prefix}/comment`, commentRouter);
        app.use(`${prefix}/code-snippet`, codeSnippetRouter);
        app.use(prefix, pageRouter);
        app.use(`${prefix}/search`, searchRouter);
    },
};

export default contentModule;
