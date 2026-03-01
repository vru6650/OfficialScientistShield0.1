// api/controllers/python.controller.js
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

export const missingPythonRuntimeMessage =
    'Python runtime is not available. Please install Python 3 to run Python code.';
export const missingPythonDockerMessage =
    'Docker sandbox is not available for Python execution. Install Docker and set CODE_RUNNER_DOCKER_IMAGE_PYTHON, or set CODE_RUNNER_MODE=local to use the host runtime.';

const LOCAL_TIMEOUT_MS = 5000;
const DOCKER_TIMEOUT_MS = 7000;

const detectPythonCommand = async (exec = execFileAsync) => {
    const candidates = ['python3', 'python'];

    for (const command of candidates) {
        try {
            await exec(command, ['--version']);
            return command;
        } catch (error) {
            if (error?.code !== 'ENOENT') {
                // Keep searching other candidates
                continue;
            }
        }
    }

    return null;
};

export const createRunPythonCode = ({
    execFile: exec = execFileAsync,
    fs: fsModule = fs,
    tempDir = TEMP_DIR,
    detectPython = detectPythonCommand,
    detectDockerRuntime = detectDocker,
    runDockerCommand = runDocker,
    dockerImage = process.env.CODE_RUNNER_DOCKER_IMAGE_PYTHON,
    runnerMode = resolveRunnerMode(),
} = {}) => {
    return async (req, res, next) => {
        const { code } = req.body ?? {};

        if (typeof code !== 'string' || !code.trim()) {
            return next(errorHandler(400, 'Python code is required.'));
        }

        let workDir;

        try {
            ({ workDir } = await createWorkspace({ fsModule, tempDir }));

            if (runnerMode === 'docker') {
                const dockerReady = await detectDockerRuntime(exec);
                if (!dockerReady || !dockerImage) {
                    return res.status(200).json({ output: missingPythonDockerMessage, error: true });
                }

                const filePath = path.join(workDir, 'main.py');
                await fsModule.promises.writeFile(filePath, code);

                const { stdout } = await runDockerCommand({
                    execFile: exec,
                    image: dockerImage,
                    workDir,
                    command: ['python3', 'main.py'],
                    timeoutMs: DOCKER_TIMEOUT_MS,
                });

                return res.status(200).json({ output: stdout, error: false });
            }

            const pythonCommand = await detectPython(exec);
            if (!pythonCommand) {
                return res.status(200).json({ output: missingPythonRuntimeMessage, error: true });
            }

            const filePath = path.join(workDir, 'main.py');
            await fsModule.promises.writeFile(filePath, code);

            const { stdout } = await exec(pythonCommand, [filePath], {
                timeout: LOCAL_TIMEOUT_MS,
                encoding: 'utf8',
            });

            return res.status(200).json({ output: stdout, error: false });
        } catch (err) {
            const output = err?.stderr || err?.stdout || err?.message || String(err);
            return res.status(200).json({ output, error: true });
        } finally {
            try {
                await cleanupWorkspace({ fsModule, workDir });
            } catch {
                // Ignore cleanup errors
            }
        }
    };
};

export const runPythonCode = createRunPythonCode();
