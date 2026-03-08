import cppRouter from '../../routes/cpp.route.js';
import pythonRouter from '../../routes/python.route.js';
import javascriptRouter from '../../routes/javascript.route.js';
import javaRouter from '../../routes/java.route.js';
import csharpRouter from '../../routes/csharp.route.js';
import codeJobRouter from './codeJob.route.js';

export const codeModule = {
    name: 'code',
    register(app, prefix) {
        app.use(`${prefix}/code`, cppRouter);
        app.use(`${prefix}/code`, pythonRouter);
        app.use(`${prefix}/code`, javascriptRouter);
        app.use(`${prefix}/code`, javaRouter);
        app.use(`${prefix}/code`, csharpRouter);
        app.use(`${prefix}/code`, codeJobRouter);
    },
};

export default codeModule;
