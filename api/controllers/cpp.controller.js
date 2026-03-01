// api/controllers/cpp.controller.js
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
export const missingCppCompilerMessage =
    'C++ compiler is not available. Please install g++ or clang to run C++ code.';
export const missingCppDockerMessage =
    'Docker sandbox is not available for C++ execution. Install Docker and set CODE_RUNNER_DOCKER_IMAGE_CPP, or set CODE_RUNNER_MODE=local to use the host toolchain.';

const LOCAL_TIMEOUT_MS = 5000;
const DOCKER_TIMEOUT_MS = 10000;

export const createRunCppCode = ({
    execFile: exec = execFileAsync,
    fs: fsModule = fs,
    tempDir = TEMP_DIR,
    detectDockerRuntime = detectDocker,
    runDockerCommand = runDocker,
    dockerImage = process.env.CODE_RUNNER_DOCKER_IMAGE_CPP,
    runnerMode = resolveRunnerMode(),
} = {}) => {
    return async (req, res, next) => {
        const { code } = req.body ?? {};
        if (typeof code !== 'string' || !code.trim()) {
            return next(errorHandler(400, 'C++ code is required.'));
        }

        let workDir;
        try {
            ({ workDir } = await createWorkspace({ fsModule, tempDir }));

            const filePath = path.join(workDir, 'main.cpp');
            const executablePath = path.join(workDir, 'main.out');

            // 1. Write the code to a temporary file
            await fsModule.promises.writeFile(filePath, code);

            if (runnerMode === 'docker') {
                const dockerReady = await detectDockerRuntime(exec);
                if (!dockerReady || !dockerImage) {
                    return res.status(200).json({ output: missingCppDockerMessage, error: true });
                }

                const { stdout } = await runDockerCommand({
                    execFile: exec,
                    image: dockerImage,
                    workDir,
                    command: ['sh', '-lc', 'g++ main.cpp -o main.out && ./main.out'],
                    timeoutMs: DOCKER_TIMEOUT_MS,
                });

                return res.status(200).json({ output: stdout, error: false });
            }

            // 2. Compile the C++ code without invoking a shell
            await exec('g++', [filePath, '-o', executablePath], { encoding: 'utf8' });

            // 3. Execute the compiled program with a timeout
            const { stdout } = await exec(executablePath, [], {
                timeout: LOCAL_TIMEOUT_MS,
                encoding: 'utf8',
            });

            // 4. Send the output back to the client
            return res.status(200).json({ output: stdout, error: false });
        } catch (err) {
            const output =
                err?.code === 'ENOENT'
                    ? missingCppCompilerMessage
                    : err?.stderr || err?.stdout || err?.message || String(err);
            return res.status(200).json({ output, error: true });
        } finally {
            // 5. Clean up temporary files
            try {
                await cleanupWorkspace({ fsModule, workDir });
            } catch {
                // Ignore cleanup errors
            }
        }
    };
};

export const runCppCode = createRunCppCode();
