// In api/controllers/javascript.controller.js

import vm from 'node:vm';
import { errorHandler } from '../utils/error.js';

// Executes user-provided JavaScript in a restricted VM context
// Captures console output and returns it as the response
export const runJavascriptCode = async (req, res, next) => {
    const { code } = req.body ?? {};

    if (typeof code !== 'string' || !code.trim()) {
        return next(errorHandler(400, 'JavaScript code is required.'));
    }

    // Capture console output
    let output = '';
    const sandboxConsole = {
        log: (...args) => {
            output += `${args.map(String).join(' ')}\n`;
        },
        error: (...args) => {
            output += `${args.map(String).join(' ')}\n`;
        },
        warn: (...args) => {
            output += `${args.map(String).join(' ')}\n`;
        },
        info: (...args) => {
            output += `${args.map(String).join(' ')}\n`;
        },
    };

    // Minimal, locked-down global context
    const context = vm.createContext({ console: sandboxConsole });

    try {
        const script = new vm.Script(code, { displayErrors: true });
        // Limit execution time and disable async require/import
        script.runInContext(context, { timeout: 1000 });
    } catch (err) {
        const rawMessage = err?.message ?? err;
        const errorMessage = typeof rawMessage === 'string' ? rawMessage : String(rawMessage);
        const combinedOutput = output ? `${output}${errorMessage}` : errorMessage;

        // Keep the response shape consistent with other runtimes so the client can
        // render the failure message without relying on the global error handler.
        return res.status(200).json({ output: combinedOutput, error: true });
    }

    return res.status(200).json({ output, error: false });
};
