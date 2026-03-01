import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from '../utils/error.js';

const execFileAsync = promisify(execFile);
const __dirname = path.resolve();

export const TEMP_DIR = path.join(__dirname, 'temp');

const normalizeEnvValue = (value, fallback) => {
    if (typeof value !== 'string') {
        return fallback;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : fallback;
};

export const resolveRunnerMode = (env = process.env) => {
    const mode = normalizeEnvValue(env.CODE_RUNNER_MODE, '').toLowerCase();

    if (mode === 'docker' || mode === 'local') {
        return mode;
    }

    return env.NODE_ENV === 'production' ? 'docker' : 'local';
};

export const ensureTempDir = async (fsModule = fs, tempDir = TEMP_DIR) => {
    await fsModule.promises.mkdir(tempDir, { recursive: true });
};

export const createWorkspace = async ({ fsModule = fs, tempDir = TEMP_DIR } = {}) => {
    await ensureTempDir(fsModule, tempDir);

    const uniqueId = uuidv4();
    const workDir = path.join(tempDir, uniqueId);

    await fsModule.promises.mkdir(workDir, { recursive: true });

    return { uniqueId, workDir };
};

export const cleanupWorkspace = async ({ fsModule = fs, workDir } = {}) => {
    if (!workDir) {
        return;
    }

    const rm = fsModule?.promises?.rm;
    if (typeof rm === 'function') {
        await rm(workDir, { recursive: true, force: true });
        return;
    }

    const rmdir = fsModule?.promises?.rmdir;
    if (typeof rmdir === 'function') {
        await rmdir(workDir, { recursive: true });
    }
};

const buildDockerResources = (env = process.env) => ({
    memory: normalizeEnvValue(env.CODE_RUNNER_MEMORY, '256m'),
    cpus: normalizeEnvValue(env.CODE_RUNNER_CPUS, '0.5'),
    pids: normalizeEnvValue(env.CODE_RUNNER_PIDS, '128'),
    tmpfs: normalizeEnvValue(env.CODE_RUNNER_TMPFS, '64m'),
    network: normalizeEnvValue(env.CODE_RUNNER_NETWORK, 'none'),
});

const resolveUidGid = () => {
    if (typeof process.getuid !== 'function' || typeof process.getgid !== 'function') {
        return null;
    }

    return `${process.getuid()}:${process.getgid()}`;
};

export const detectDocker = async (exec = execFileAsync) => {
    try {
        await exec('docker', ['--version'], { encoding: 'utf8' });
        return true;
    } catch {
        return false;
    }
};

export const runDocker = async ({
    execFile: exec = execFileAsync,
    image,
    workDir,
    command = [],
    timeoutMs = 7000,
    maxBuffer = 1024 * 1024,
    env = process.env,
    envVars = {},
} = {}) => {
    if (!image) {
        throw errorHandler(500, 'Docker image is required for sandboxed execution.');
    }

    if (!workDir) {
        throw errorHandler(500, 'Docker workspace is required for sandboxed execution.');
    }

    const { memory, cpus, pids, tmpfs, network } = buildDockerResources(env);
    const uidGid = resolveUidGid();
    const dockerArgs = [
        'run',
        '--rm',
        '--network',
        network,
        '--memory',
        memory,
        '--memory-swap',
        memory,
        '--cpus',
        cpus,
        '--pids-limit',
        pids,
        '--read-only',
        '--security-opt',
        'no-new-privileges',
        '--cap-drop',
        'ALL',
        '--tmpfs',
        `/tmp:rw,noexec,nosuid,size=${tmpfs}`,
        '-v',
        `${workDir}:/workspace:rw`,
        '-w',
        '/workspace',
    ];

    if (uidGid) {
        dockerArgs.push('--user', uidGid);
    }

    const combinedEnv = {
        HOME: '/tmp',
        ...envVars,
    };

    Object.entries(combinedEnv).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length) {
            dockerArgs.push('-e', `${key}=${value}`);
        }
    });

    dockerArgs.push(image, ...command);

    return exec('docker', dockerArgs, {
        timeout: timeoutMs,
        encoding: 'utf8',
        maxBuffer,
    });
};
