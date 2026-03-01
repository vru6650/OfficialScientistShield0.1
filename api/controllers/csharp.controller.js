// api/controllers/csharp.controller.js
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
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

const LOCAL_SCRIPT_TIMEOUT_MS = 5000;
const LOCAL_DOTNET_TIMEOUT_MS = 10000;
const DOCKER_TIMEOUT_MS = 12000;

const projectFileTemplate = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
`;

const runnerCandidates = [
    {
        name: 'dotnet (build & run)',
        async detect() {
            await execFileAsync('dotnet', ['--version']);
            return {
                async run(code, uniqueId) {
                    const projectDir = path.join(TEMP_DIR, uniqueId);
                    const projectPath = path.join(projectDir, 'App.csproj');
                    const programPath = path.join(projectDir, 'Program.cs');

                    await fs.promises.mkdir(projectDir, { recursive: true });
                    await fs.promises.writeFile(programPath, code);
                    await fs.promises.writeFile(projectPath, projectFileTemplate);

                    try {
                        return await execFileAsync('dotnet', ['run', '--project', projectPath], {
                            cwd: projectDir,
                            timeout: LOCAL_DOTNET_TIMEOUT_MS,
                            encoding: 'utf8',
                            maxBuffer: 1024 * 1024,
                        });
                    } finally {
                        await fs.promises.rm(projectDir, { recursive: true, force: true });
                    }
                },
            };
        },
    },
    {
        name: 'dotnet-script',
        async detect() {
            await execFileAsync('dotnet-script', ['--version']);
            return {
                command: 'dotnet-script',
                buildArgs: (filePath) => [filePath],
                extension: '.csx',
            };
        },
    },
    {
        name: 'dotnet-script (via dotnet CLI)',
        async detect() {
            await execFileAsync('dotnet', ['script', '--version']);
            return {
                command: 'dotnet',
                buildArgs: (filePath) => ['script', filePath],
                extension: '.csx',
            };
        },
    },
    {
        name: 'csi',
        async detect() {
            await execFileAsync('csi', ['-help']);
            return {
                command: 'csi',
                buildArgs: (filePath) => [filePath],
                extension: '.csx',
            };
        },
    },
    {
        name: 'scriptcs',
        async detect() {
            await execFileAsync('scriptcs', ['-help']);
            return {
                command: 'scriptcs',
                buildArgs: (filePath) => [filePath],
                extension: '.csx',
            };
        },
    },
];

let cachedRunner = null;

const findCSharpRunner = async () => {
    if (cachedRunner) {
        return cachedRunner;
    }

    for (const candidate of runnerCandidates) {
        try {
            const runner = await candidate.detect();
            cachedRunner = runner;
            return runner;
        } catch (error) {
            if (error?.code !== 'ENOENT') {
                console.warn(`C# runner detection failed for ${candidate.name}: ${error.message}`);
            }
        }
    }

    return null;
};

export const missingRuntimeMessage =
    'C# runtime is not available on the server. Install the .NET SDK (dotnet CLI), dotnet-script, dotnet script, csi, or scriptcs to enable C# execution.';
export const missingCSharpDockerMessage =
    'Docker sandbox is not available for C# execution. Install Docker and set CODE_RUNNER_DOCKER_IMAGE_CSHARP, or set CODE_RUNNER_MODE=local to use the host runtime.';

export const createRunCSharpCode = ({
    findRunner = findCSharpRunner,
    fs: fsModule = fs,
    execFile: exec = execFileAsync,
    tempDir = TEMP_DIR,
    detectDockerRuntime = detectDocker,
    runDockerCommand = runDocker,
    dockerImage = process.env.CODE_RUNNER_DOCKER_IMAGE_CSHARP,
    runnerMode = resolveRunnerMode(),
} = {}) => {
    return async (req, res, next) => {
        const { code } = req.body ?? {};

        if (typeof code !== 'string' || !code.trim()) {
            return next(errorHandler(400, 'C# code is required.'));
        }

        await fsModule.promises.mkdir(tempDir, { recursive: true });

        if (runnerMode === 'docker') {
            const dockerReady = await detectDockerRuntime(exec);
            if (!dockerReady || !dockerImage) {
                return res.status(200).json({ output: missingCSharpDockerMessage, error: true });
            }

            let workDir;
            try {
                ({ workDir } = await createWorkspace({ fsModule, tempDir }));
                const projectPath = path.join(workDir, 'App.csproj');
                const programPath = path.join(workDir, 'Program.cs');
                await fsModule.promises.writeFile(programPath, code);
                await fsModule.promises.writeFile(projectPath, projectFileTemplate);

                const { stdout } = await runDockerCommand({
                    execFile: exec,
                    image: dockerImage,
                    workDir,
                    command: ['dotnet', 'run', '--project', 'App.csproj'],
                    timeoutMs: DOCKER_TIMEOUT_MS,
                    envVars: {
                        DOTNET_CLI_TELEMETRY_OPTOUT: '1',
                        DOTNET_SKIP_FIRST_TIME_EXPERIENCE: '1',
                        NUGET_XMLDOC_MODE: 'skip',
                    },
                });

                return res.status(200).json({ output: stdout, error: false });
            } catch (error) {
                const stderr = typeof error?.stderr === 'string' ? error.stderr : error?.stderr?.toString?.();
                const stdout = typeof error?.stdout === 'string' ? error.stdout : error?.stdout?.toString?.();
                const outputMessage = [stderr, stdout].filter(Boolean).join('\n').trim();
                const fallbackMessage = error?.message || String(error);
                const output = outputMessage || fallbackMessage;
                return res.status(200).json({ output, error: true });
            } finally {
                try {
                    await cleanupWorkspace({ fsModule, workDir });
                } catch {
                    // Ignore cleanup errors
                }
            }
        }

        const runner = await findRunner();
        if (!runner) {
            return res.status(200).json({ output: missingRuntimeMessage, error: true });
        }

        const uniqueId = uuidv4();

        try {
            const executionResult =
                typeof runner.run === 'function'
                    ? await runner.run(code, uniqueId)
                    : await (async () => {
                        const filePath = path.join(tempDir, `${uniqueId}${runner.extension || '.csx'}`);
                        await fsModule.promises.writeFile(filePath, code);
                        try {
                            return await exec(runner.command, runner.buildArgs(filePath), {
                                timeout: LOCAL_SCRIPT_TIMEOUT_MS,
                                encoding: 'utf8',
                                maxBuffer: 1024 * 1024, // 1 MB to capture compiler diagnostics comfortably
                            });
                        } finally {
                            try {
                                await fsModule.promises.unlink(filePath);
                            } catch {
                                // Ignore cleanup errors
                            }
                        }
                    })();

            const { stdout } = executionResult ?? {};

            return res.status(200).json({ output: stdout, error: false });
        } catch (error) {
            if (error?.code === 'ENOENT') {
                cachedRunner = null;
                return res.status(200).json({ output: missingRuntimeMessage, error: true });
            }

            const stderr = typeof error?.stderr === 'string' ? error.stderr : error?.stderr?.toString?.();
            const stdout = typeof error?.stdout === 'string' ? error.stdout : error?.stdout?.toString?.();
            const outputMessage = [stderr, stdout].filter(Boolean).join('\n').trim();
            const fallbackMessage = error?.message || String(error);
            const runtimeFailurePattern = /(dotnet-script|dotnet script|csi|scriptcs|dotnet)/i;
            const output =
                outputMessage || (runtimeFailurePattern.test(fallbackMessage) ? missingRuntimeMessage : fallbackMessage);
            return res.status(200).json({ output, error: true });
        }
    };
};

export const runCSharpCode = createRunCSharpCode();
