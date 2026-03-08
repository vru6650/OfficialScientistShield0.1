import { runCppCode } from '../controllers/cpp.controller.js';
import { runCSharpCode } from '../controllers/csharp.controller.js';
import { runJavaCode } from '../controllers/java.controller.js';
import { runJavascriptCode } from '../controllers/javascript.controller.js';
import { runPythonCode } from '../controllers/python.controller.js';

const languageHandlers = {
    javascript: runJavascriptCode,
    js: runJavascriptCode,
    python: runPythonCode,
    py: runPythonCode,
    cpp: runCppCode,
    'c++': runCppCode,
    java: runJavaCode,
    csharp: runCSharpCode,
    'c#': runCSharpCode,
};

const toRuntimeErrorPayload = (error) => {
    const message = error?.message || 'Code execution failed.';

    return {
        output: message,
        error: true,
        statusCode: error?.statusCode || 500,
    };
};

const executeControllerHandler = async (handler, code) => {
    const req = { body: { code } };
    let payload = null;
    let forwardedError = null;

    const res = {
        status() {
            return this;
        },
        json(data) {
            payload = data;
            return this;
        },
    };

    await handler(req, res, (error) => {
        forwardedError = error;
    });

    if (forwardedError) {
        return toRuntimeErrorPayload(forwardedError);
    }

    if (!payload || typeof payload !== 'object') {
        return {
            output: '',
            error: false,
        };
    }

    return {
        output: typeof payload.output === 'string' ? payload.output : String(payload.output ?? ''),
        error: Boolean(payload.error),
    };
};

export const normalizeCodeLanguage = (language) => {
    return String(language || '').trim().toLowerCase();
};

export const getCodeExecutionHandler = (language) => {
    const normalizedLanguage = normalizeCodeLanguage(language);
    return languageHandlers[normalizedLanguage] || null;
};

export const executeCodeJob = async ({ language, code }) => {
    const handler = getCodeExecutionHandler(language);

    if (!handler) {
        return {
            output: `Unsupported language "${language}".`,
            error: true,
            statusCode: 400,
        };
    }

    return executeControllerHandler(handler, code);
};
