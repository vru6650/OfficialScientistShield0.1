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

const runExecFile = (...args) => execFileAsync(...args);

const toText = (value) => (typeof value === 'string' ? value : value?.toString?.() ?? '');

export const missingJavaDockerMessage =
    'Docker sandbox is not available for Java execution. Install Docker and set CODE_RUNNER_DOCKER_IMAGE_JAVA, or set CODE_RUNNER_MODE=local to use the host toolchain.';

const LOCAL_TIMEOUT_MS = 7000;
const DOCKER_TIMEOUT_MS = 12000;

export const createRunJavaCode = ({
    execFile: exec = runExecFile,
    fs: fsModule = fs,
    tempDir = TEMP_DIR,
    detectDockerRuntime = detectDocker,
    runDockerCommand = runDocker,
    dockerImage = process.env.CODE_RUNNER_DOCKER_IMAGE_JAVA,
    runnerMode = resolveRunnerMode(),
} = {}) => {
    return async (req, res, next) => {
        const { code } = req.body ?? {};

        if (typeof code !== 'string' || !code.trim()) {
            return next(errorHandler(400, 'Java code is required.'));
        }

        let workDir;
        const fileName = 'Main.java';
        const className = 'Main';
        const execOptions = {
            timeout: LOCAL_TIMEOUT_MS,
            encoding: 'utf8',
            maxBuffer: 1024 * 1024,
        };

        try {
            ({ workDir } = await createWorkspace({ fsModule, tempDir }));
            const filePath = path.join(workDir, fileName);
            await fsModule.promises.writeFile(filePath, code);

            if (runnerMode === 'docker') {
                const dockerReady = await detectDockerRuntime(exec);
                if (!dockerReady || !dockerImage) {
                    return res.status(200).json({ output: missingJavaDockerMessage, error: true });
                }

                const { stdout } = await runDockerCommand({
                    execFile: exec,
                    image: dockerImage,
                    workDir,
                    command: ['sh', '-lc', 'javac Main.java && java Main'],
                    timeoutMs: DOCKER_TIMEOUT_MS,
                });

                return res.status(200).json({ output: toText(stdout), error: false });
            }

            await exec('javac', [fileName], { ...execOptions, cwd: workDir });

            const { stdout } = await exec('java', [className], { ...execOptions, cwd: workDir });
            const output = toText(stdout);

            return res.status(200).json({ output, error: false });
        } catch (err) {
            let output;
            if (err?.code === 'ENOENT') {
                output = 'Java runtime or compiler is not available. Please install a JDK to run Java code.';
            } else {
                output =
                    toText(err?.stderr) ||
                    toText(err?.stdout) ||
                    toText(err?.message) ||
                    String(err);
            }
            return res.status(200).json({ output, error: true });
        } finally {
            try {
                await cleanupWorkspace({ fsModule, workDir });
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }
    };
};

export const runJavaCode = createRunJavaCode();
