// In api/controllers/javascript.controller.js

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { errorHandler } from '../utils/error.js';
import {
    cleanupWorkspace,
    createWorkspace,
    detectDocker,
    resolveRunnerMode,
    runDocker,
    TEMP_DIR,
} from '../services/codeRunnerSandbox.service.js';

const execFileAsync = promisify(execFile);
const LOCAL_TIMEOUT_MS = 5000;
const DOCKER_TIMEOUT_MS = 7000;

export const missingNodeDockerMessage =
    'Docker sandbox is not available for JavaScript execution. Install Docker and set CODE_RUNNER_DOCKER_IMAGE_NODE, or set CODE_RUNNER_MODE=local to use the host runtime.';

export const runJavascriptCode = async (req, res, next) => {
    const { code } = req.body ?? {};

    if (typeof code !== 'string' || !code.trim()) {
        return next(errorHandler(400, 'JavaScript code is required.'));
    }

    const runnerMode = resolveRunnerMode();
    const dockerImage = process.env.CODE_RUNNER_DOCKER_IMAGE_NODE;

    let workDir;

    try {
        const workspace = await createWorkspace({ fsModule: fs, tempDir: TEMP_DIR });
        workDir = workspace.workDir;

        if (runnerMode === 'docker') {
            const dockerReady = await detectDocker(execFileAsync);
            if (!dockerReady || !dockerImage) {
                return res.status(200).json({ output: missingNodeDockerMessage, error: true });
            }

            const filePath = path.join(workDir, 'main.js');
            await fs.promises.writeFile(filePath, code);

            const { stdout } = await runDocker({
                execFile: execFileAsync,
                image: dockerImage,
                workDir,
                command: ['node', 'main.js'],
                timeoutMs: DOCKER_TIMEOUT_MS,
            });

            return res.status(200).json({ output: stdout, error: false });
        }

        const filePath = path.join(workDir, 'main.js');
        await fs.promises.writeFile(filePath, code);

        const { stdout } = await execFileAsync('node', [filePath], {
            timeout: LOCAL_TIMEOUT_MS,
            encoding: 'utf8',
        });

        return res.status(200).json({ output: stdout, error: false });
    } catch (err) {
        const stdoutStr = err?.stdout ? String(err.stdout) : '';
        const stderrStr = err?.stderr ? String(err.stderr) : '';
        const msgStr = err?.message ? String(err.message) : String(err);
        const output = stdoutStr + stderrStr || msgStr;
        return res.status(200).json({ output, error: true });
    } finally {
        try {
            await cleanupWorkspace({ fsModule: fs, workDir });
        } catch {
            // Ignore cleanup errors
        }
    }
};
