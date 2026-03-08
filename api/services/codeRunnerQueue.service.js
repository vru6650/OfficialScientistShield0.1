import { fork } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const JOB_RETENTION_MS = Number(process.env.CODE_RUNNER_JOB_RETENTION_MS || 5 * 60 * 1000);
const DEFAULT_WAIT_TIMEOUT_MS = Number(process.env.CODE_RUNNER_JOB_WAIT_TIMEOUT_MS || 15000);

const jobs = new Map();
const pendingJobIds = [];
const jobWaiters = new Map();

let workerProcess = null;
let workerReady = false;
let workerStartPromise = null;
let activeJobId = null;

const workerScriptPath = path.join(path.resolve(), 'api', 'workers', 'codeRunner.worker.js');

const nowIso = () => new Date().toISOString();

const cleanupExpiredJobs = () => {
    const now = Date.now();

    for (const [jobId, job] of jobs.entries()) {
        if (job.status !== 'completed' && job.status !== 'failed') {
            continue;
        }

        const finishedAt = job.finishedAt ? Date.parse(job.finishedAt) : 0;
        if (!finishedAt || now - finishedAt <= JOB_RETENTION_MS) {
            continue;
        }

        jobs.delete(jobId);
        jobWaiters.delete(jobId);
    }
};

const notifyWaiters = (jobId) => {
    const waiters = jobWaiters.get(jobId) || [];
    const job = toPublicJob(jobs.get(jobId) || null);

    for (const waiter of waiters) {
        clearTimeout(waiter.timeoutHandle);
        waiter.resolve(job);
    }

    jobWaiters.delete(jobId);
};

const failActiveJob = (message) => {
    if (!activeJobId) {
        return;
    }

    const job = jobs.get(activeJobId);

    if (job) {
        job.status = 'failed';
        job.output = message;
        job.error = true;
        job.statusCode = 500;
        job.finishedAt = nowIso();
        job.updatedAt = job.finishedAt;
    }

    notifyWaiters(activeJobId);
    activeJobId = null;
};

const bindWorkerEvents = (child) => {
    child.on('message', (message) => {
        if (!message || typeof message !== 'object') {
            return;
        }

        if (message.type === 'ready') {
            workerReady = true;
            if (workerStartPromise?.resolve) {
                workerStartPromise.resolve(child);
                workerStartPromise = null;
            }
            scheduleDispatch();
            return;
        }

        if (message.type !== 'result') {
            return;
        }

        const { jobId, result = {} } = message;
        const job = jobs.get(jobId);

        if (job) {
            job.status = 'completed';
            job.output = typeof result.output === 'string' ? result.output : String(result.output ?? '');
            job.error = Boolean(result.error);
            job.statusCode = Number(result.statusCode || 200);
            job.finishedAt = nowIso();
            job.updatedAt = job.finishedAt;
        }

        if (activeJobId === jobId) {
            activeJobId = null;
        }

        notifyWaiters(jobId);
        scheduleDispatch();
    });

    child.on('exit', (code, signal) => {
        const reason = `Code worker exited unexpectedly (${signal || code || 'unknown'}).`;
        failActiveJob(reason);

        workerReady = false;
        workerProcess = null;

        if (workerStartPromise?.reject) {
            workerStartPromise.reject(new Error(reason));
            workerStartPromise = null;
        }

        scheduleDispatch();
    });

    child.on('error', (error) => {
        const reason = error?.message || 'Code worker process error.';
        failActiveJob(reason);

        workerReady = false;
        workerProcess = null;

        if (workerStartPromise?.reject) {
            workerStartPromise.reject(error);
            workerStartPromise = null;
        }

        scheduleDispatch();
    });
};

const ensureWorker = async () => {
    if (workerProcess && workerReady) {
        return workerProcess;
    }

    if (workerStartPromise) {
        return workerStartPromise.promise;
    }

    let resolveStart;
    let rejectStart;

    const promise = new Promise((resolve, reject) => {
        resolveStart = resolve;
        rejectStart = reject;
    });

    workerStartPromise = {
        promise,
        resolve: resolveStart,
        reject: rejectStart,
    };

    const child = fork(workerScriptPath, {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    workerProcess = child;
    bindWorkerEvents(child);

    return promise;
};

const dispatchNextJob = async () => {
    cleanupExpiredJobs();

    if (activeJobId || pendingJobIds.length === 0) {
        return;
    }

    try {
        await ensureWorker();
    } catch (error) {
        const nextJobId = pendingJobIds.shift();
        if (!nextJobId) {
            return;
        }

        const job = jobs.get(nextJobId);
        if (job) {
            job.status = 'failed';
            job.output = error?.message || 'Unable to start code worker.';
            job.error = true;
            job.statusCode = 500;
            job.finishedAt = nowIso();
            job.updatedAt = job.finishedAt;
        }

        notifyWaiters(nextJobId);
        scheduleDispatch();
        return;
    }

    const jobId = pendingJobIds.shift();
    const job = jobs.get(jobId);

    if (!job) {
        scheduleDispatch();
        return;
    }

    activeJobId = jobId;
    job.status = 'processing';
    job.startedAt = nowIso();
    job.updatedAt = job.startedAt;

    try {
        workerProcess.send({
            type: 'run',
            jobId,
            payload: {
                language: job.language,
                code: job.code,
            },
        });
    } catch (error) {
        job.status = 'failed';
        job.output = error?.message || 'Failed to send job to code worker.';
        job.error = true;
        job.statusCode = 500;
        job.finishedAt = nowIso();
        job.updatedAt = job.finishedAt;
        activeJobId = null;
        notifyWaiters(jobId);
        scheduleDispatch();
    }
};

let dispatchScheduled = false;

const scheduleDispatch = () => {
    if (dispatchScheduled) {
        return;
    }

    dispatchScheduled = true;

    queueMicrotask(() => {
        dispatchScheduled = false;
        dispatchNextJob().catch((error) => {
            console.error('Failed to dispatch code runner job:', error);
        });
    });
};

const toPublicJob = (job) => {
    if (!job) {
        return null;
    }

    return {
        jobId: job.jobId,
        language: job.language,
        status: job.status,
        output: job.output,
        error: job.error,
        statusCode: job.statusCode,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
    };
};

export const enqueueCodeJob = ({ language, code }) => {
    cleanupExpiredJobs();

    const jobId = uuidv4();
    const createdAt = nowIso();

    jobs.set(jobId, {
        jobId,
        language: String(language || '').trim().toLowerCase(),
        code,
        status: 'queued',
        output: null,
        error: null,
        statusCode: null,
        createdAt,
        updatedAt: createdAt,
        startedAt: null,
        finishedAt: null,
    });

    pendingJobIds.push(jobId);
    scheduleDispatch();

    return toPublicJob(jobs.get(jobId));
};

export const getCodeJob = (jobId) => {
    cleanupExpiredJobs();
    return toPublicJob(jobs.get(jobId) || null);
};

export const waitForCodeJob = (jobId, { timeoutMs = DEFAULT_WAIT_TIMEOUT_MS } = {}) => {
    const job = jobs.get(jobId);

    if (!job) {
        return Promise.resolve(null);
    }

    if (job.status === 'completed' || job.status === 'failed') {
        return Promise.resolve(toPublicJob(job));
    }

    return new Promise((resolve) => {
        const timeoutHandle = setTimeout(() => {
            const latest = getCodeJob(jobId);
            const waiters = jobWaiters.get(jobId) || [];
            jobWaiters.set(
                jobId,
                waiters.filter((waiter) => waiter.resolve !== resolve)
            );
            resolve(latest);
        }, Math.max(100, timeoutMs));

        const waiters = jobWaiters.get(jobId) || [];
        waiters.push({ resolve, timeoutHandle });
        jobWaiters.set(jobId, waiters);
    });
};

export const shutdownCodeRunnerQueue = async () => {
    if (!workerProcess) {
        return;
    }

    const worker = workerProcess;
    workerProcess = null;
    workerReady = false;

    await new Promise((resolve) => {
        worker.once('exit', () => resolve());
        worker.kill();
    });
};
