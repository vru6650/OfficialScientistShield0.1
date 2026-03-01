import vm from 'vm';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import {
    cleanupWorkspace,
    createWorkspace,
    detectDocker,
    resolveRunnerMode,
    runDocker,
} from './codeRunnerSandbox.service.js';

const execFileAsync = promisify(execFile);
const __dirname = path.resolve();
const TEMP_DIR = path.join(__dirname, 'temp', 'visualizer');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const PYTHON_LOCAL_TIMEOUT_MS = 5000;
const PYTHON_DOCKER_TIMEOUT_MS = 7000;
const MISSING_PYTHON_DOCKER_MESSAGE =
    'Docker sandbox is not available for Python visualizer execution. Install Docker and set CODE_RUNNER_DOCKER_IMAGE_PYTHON, or set CODE_RUNNER_MODE=local to use the host runtime.';

const createSortingConfig = (size) => {
    const length = clamp(size ?? 10, 4, 32);
    const array = Array.from({ length }, () => randomInt(5, 99));
    return {
        type: 'sorting',
        array,
        size: length,
    };
};

const createGraphConfig = (size) => {
    const count = clamp(size ?? 6, 4, 14);
    const nodes = Array.from({ length: count }, (_, index) => ({
        id: `N${index}`,
        label: `Node ${index}`,
    }));

    const edges = [];
    const edgeSet = new Set();

    const registerEdge = (a, b) => {
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (edgeSet.has(key)) return false;
        edgeSet.add(key);
        edges.push({ source: `N${a}`, target: `N${b}` });
        return true;
    };

    for (let i = 1; i < count; i += 1) {
        const parent = randomInt(0, i - 1);
        registerEdge(parent, i);
    }

    const additionalEdges = clamp(Math.floor(count / 2), 1, count);
    let attempts = 0;
    while (edgeSet.size < count - 1 + additionalEdges && attempts < 60) {
        const a = randomInt(0, count - 1);
        const b = randomInt(0, count - 1);
        if (a === b) {
            attempts += 1;
            continue;
        }
        registerEdge(a, b);
        attempts += 1;
    }

    return {
        type: 'graph',
        nodes,
        edges,
        startNode: nodes[0].id,
    };
};

const createTreeConfig = (size) => {
    const count = clamp(size ?? 7, 3, 18);
    const values = [];
    const used = new Set();
    while (values.length < count) {
        const candidate = randomInt(8, 99);
        if (used.has(candidate)) continue;
        used.add(candidate);
        values.push(candidate);
    }

    return {
        type: 'tree',
        values,
    };
};

const buildConfig = (algorithmId, params = {}) => {
    const { arraySize } = params;

    if (['bubble-sort', 'merge-sort', 'quick-sort'].includes(algorithmId)) {
        return createSortingConfig(arraySize);
    }

    if (['bfs', 'dfs'].includes(algorithmId)) {
        return createGraphConfig(arraySize);
    }

    if (algorithmId === 'bst-insert') {
        return createTreeConfig(arraySize);
    }

    return { type: 'generic' };
};

const cloneArray = (array) => array.map((value) => value);

const createArrayStep = (array, extra = {}) => ({
    mode: 'sorting',
    array: cloneArray(array),
    ...extra,
});

const generateBubbleSortSteps = (config) => {
    const arr = cloneArray(config.array);
    const steps = [];
    const sorted = new Set();

    for (let end = arr.length - 1; end > 0; end -= 1) {
        for (let i = 0; i < end; i += 1) {
            steps.push(
                createArrayStep(arr, {
                    stage: 'compare',
                    message: `Comparing indices ${i} and ${i + 1}`,
                    highlights: {
                        compare: [i, i + 1],
                        boundary: end,
                        sorted: Array.from(sorted),
                    },
                }),
            );

            if (arr[i] > arr[i + 1]) {
                const temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                steps.push(
                    createArrayStep(arr, {
                        stage: 'swap',
                        message: `Swapped values at positions ${i} and ${i + 1}`,
                        highlights: {
                            swap: [i, i + 1],
                            boundary: end,
                            sorted: Array.from(sorted),
                        },
                    }),
                );
            }
        }
        sorted.add(end);
        steps.push(
            createArrayStep(arr, {
                stage: 'locked',
                message: `Index ${end} is now in final position`,
                highlights: {
                    sorted: Array.from(sorted),
                },
            }),
        );
    }

    sorted.add(0);
    steps.push(
        createArrayStep(arr, {
            stage: 'complete',
            message: 'Array is sorted',
            highlights: {
                sorted: Array.from(sorted),
            },
        }),
    );

    return steps;
};

const generateMergeSortSteps = (config) => {
    const arr = cloneArray(config.array);
    const aux = cloneArray(arr);
    const steps = [];

    const markSortedRange = (start, end) => ({
        sorted: Array.from({ length: end - start + 1 }, (_, index) => start + index),
    });

    const merge = (start, mid, end) => {
        for (let index = start; index <= end; index += 1) {
            aux[index] = arr[index];
        }

        let left = start;
        let right = mid + 1;
        let current = start;

        while (left <= mid && right <= end) {
            steps.push(
                createArrayStep(arr, {
                    stage: 'compare',
                    message: `Compare left index ${left} with right index ${right}`,
                    highlights: {
                        window: [start, end],
                        compare: [left, right],
                        pivot: mid,
                    },
                }),
            );

            if (aux[left] <= aux[right]) {
                arr[current] = aux[left];
                steps.push(
                    createArrayStep(arr, {
                        stage: 'write',
                        message: `Write ${aux[left]} into index ${current}`,
                        highlights: {
                            window: [start, end],
                            keyIndex: current,
                        },
                    }),
                );
                left += 1;
            } else {
                arr[current] = aux[right];
                steps.push(
                    createArrayStep(arr, {
                        stage: 'write',
                        message: `Write ${aux[right]} into index ${current}`,
                        highlights: {
                            window: [start, end],
                            keyIndex: current,
                        },
                    }),
                );
                right += 1;
            }
            current += 1;
        }

        while (left <= mid) {
            arr[current] = aux[left];
            steps.push(
                createArrayStep(arr, {
                    stage: 'write',
                    message: `Write remaining ${aux[left]} into index ${current}`,
                    highlights: {
                        window: [start, end],
                        keyIndex: current,
                    },
                }),
            );
            left += 1;
            current += 1;
        }

        while (right <= end) {
            arr[current] = aux[right];
            steps.push(
                createArrayStep(arr, {
                    stage: 'write',
                    message: `Write remaining ${aux[right]} into index ${current}`,
                    highlights: {
                        window: [start, end],
                        keyIndex: current,
                    },
                }),
            );
            right += 1;
            current += 1;
        }

        steps.push(
            createArrayStep(arr, {
                stage: 'merged',
                message: `Merged range [${start}, ${end}]`,
                highlights: {
                    window: [start, end],
                    ...markSortedRange(start, end),
                },
            }),
        );
    };

    const sort = (start, end) => {
        if (start >= end) return;
        const mid = Math.floor((start + end) / 2);

        steps.push(
            createArrayStep(arr, {
                stage: 'split',
                message: `Divide range [${start}, ${end}] at midpoint ${mid}`,
                highlights: {
                    window: [start, end],
                    pivot: mid,
                },
            }),
        );

        sort(start, mid);
        sort(mid + 1, end);
        merge(start, mid, end);
    };

    sort(0, arr.length - 1);

    steps.push(
        createArrayStep(arr, {
            stage: 'complete',
            message: 'Merge sort complete',
            highlights: {
                sorted: Array.from({ length: arr.length }, (_, index) => index),
            },
        }),
    );

    return steps;
};

const generateQuickSortSteps = (config) => {
    const arr = cloneArray(config.array);
    const steps = [];
    const sorted = new Set();

    const partition = (left, right, depth) => {
        const pivotIndex = right;
        const pivotValue = arr[pivotIndex];
        let storeIndex = left;

        steps.push(
            createArrayStep(arr, {
                stage: 'partition',
                message: `Partition range [${left}, ${right}] with pivot index ${pivotIndex}`,
                highlights: {
                    window: [left, right],
                    pivot: pivotIndex,
                    depth,
                    sorted: Array.from(sorted),
                },
            }),
        );

        for (let i = left; i < right; i += 1) {
            steps.push(
                createArrayStep(arr, {
                    stage: 'compare',
                    message: `Compare index ${i} with pivot ${pivotIndex}`,
                    highlights: {
                        window: [left, right],
                        compare: [i, pivotIndex],
                        keyIndex: storeIndex,
                        pivot: pivotIndex,
                        sorted: Array.from(sorted),
                    },
                }),
            );

            if (arr[i] < pivotValue) {
                if (i !== storeIndex) {
                    const temp = arr[i];
                    arr[i] = arr[storeIndex];
                    arr[storeIndex] = temp;
                    steps.push(
                        createArrayStep(arr, {
                            stage: 'swap',
                            message: `Swap index ${i} with store index ${storeIndex}`,
                            highlights: {
                                swap: [i, storeIndex],
                                window: [left, right],
                                pivot: pivotIndex,
                                sorted: Array.from(sorted),
                            },
                        }),
                    );
                }
                storeIndex += 1;
            }
        }

        if (storeIndex !== pivotIndex) {
            const temp = arr[storeIndex];
            arr[storeIndex] = arr[pivotIndex];
            arr[pivotIndex] = temp;
            steps.push(
                createArrayStep(arr, {
                    stage: 'pivot-swap',
                    message: `Move pivot to index ${storeIndex}`,
                    highlights: {
                        swap: [storeIndex, pivotIndex],
                        pivot: storeIndex,
                        sorted: Array.from(sorted),
                    },
                }),
            );
        }

        sorted.add(storeIndex);
        steps.push(
            createArrayStep(arr, {
                stage: 'pivot-placed',
                message: `Pivot fixed at index ${storeIndex}`,
                highlights: {
                    sorted: Array.from(sorted),
                },
            }),
        );

        return storeIndex;
    };

    const sort = (left, right, depth = 0) => {
        if (left >= right) return;
        const pivotLocation = partition(left, right, depth);
        sort(left, pivotLocation - 1, depth + 1);
        sort(pivotLocation + 1, right, depth + 1);
    };

    sort(0, arr.length - 1);

    steps.push(
        createArrayStep(arr, {
            stage: 'complete',
            message: 'Quick sort complete',
            highlights: {
                sorted: Array.from({ length: arr.length }, (_, index) => index),
            },
        }),
    );

    return steps;
};

const buildAdjacency = (graph) => {
    const adjacency = new Map();
    graph.nodes.forEach((node) => adjacency.set(node.id, new Set()));
    graph.edges.forEach((edge) => {
        adjacency.get(edge.source).add(edge.target);
        adjacency.get(edge.target).add(edge.source);
    });
    return adjacency;
};

const snapshotGraph = (graph, visited, frontier, current, highlightEdge, order, stage, message) => ({
    mode: 'graph',
    stage,
    message,
    graph: {
        nodes: graph.nodes.map((node) => ({
            ...node,
            visited: visited.has(node.id),
            frontier: frontier.includes(node.id),
            current: node.id === current,
            order,
        })),
        edges: graph.edges.map((edge) => ({
            ...edge,
            active:
                highlightEdge &&
                ((edge.source === highlightEdge.source && edge.target === highlightEdge.target) ||
                    (edge.source === highlightEdge.target && edge.target === highlightEdge.source)),
        })),
    },
});

const generateBfsSteps = (config) => {
    const graph = config;
    const adjacency = buildAdjacency(graph);
    const visited = new Set();
    const queue = [];
    const steps = [];
    const order = [];

    visited.add(graph.startNode);
    queue.push(graph.startNode);

    steps.push(
        snapshotGraph(graph, visited, [...queue], graph.startNode, null, [...order], 'start', `Begin BFS at ${graph.startNode}`),
    );

    while (queue.length > 0) {
        const nodeId = queue.shift();
        order.push(nodeId);
        steps.push(
            snapshotGraph(
                graph,
                visited,
                [...queue],
                nodeId,
                null,
                [...order],
                'visit',
                `Visiting ${nodeId}`,
            ),
        );

        const neighbours = Array.from(adjacency.get(nodeId)).sort();
        neighbours.forEach((neighbor) => {
            const edge = { source: nodeId, target: neighbor };
            steps.push(
                snapshotGraph(
                    graph,
                    visited,
                    [...queue],
                    nodeId,
                    edge,
                    [...order],
                    'inspect',
                    `Inspect edge ${nodeId} → ${neighbor}`,
                ),
            );

            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
                steps.push(
                    snapshotGraph(
                        graph,
                        visited,
                        [...queue],
                        nodeId,
                        edge,
                        [...order],
                        'enqueue',
                        `Add ${neighbor} to the queue`,
                    ),
                );
            }
        });
    }

    steps.push(
        snapshotGraph(graph, visited, [], null, null, [...order], 'complete', 'BFS traversal complete'),
    );

    return steps;
};

const generateDfsSteps = (config) => {
    const graph = config;
    const adjacency = buildAdjacency(graph);
    const visited = new Set();
    const stack = [];
    const steps = [];
    const order = [];

    stack.push(graph.startNode);

    steps.push(
        snapshotGraph(graph, visited, [...stack], graph.startNode, null, [...order], 'start', `Begin DFS at ${graph.startNode}`),
    );

    while (stack.length > 0) {
        const nodeId = stack.pop();
        if (visited.has(nodeId)) {
            steps.push(
                snapshotGraph(
                    graph,
                    visited,
                    [...stack],
                    nodeId,
                    null,
                    [...order],
                    'skip',
                    `Skip ${nodeId} because it is already visited`,
                ),
            );
            continue;
        }

        visited.add(nodeId);
        order.push(nodeId);
        steps.push(
            snapshotGraph(
                graph,
                visited,
                [...stack],
                nodeId,
                null,
                [...order],
                'visit',
                `Visit ${nodeId}`,
            ),
        );

        const neighbours = Array.from(adjacency.get(nodeId))
            .sort()
            .reverse();
        neighbours.forEach((neighbor) => {
            const edge = { source: nodeId, target: neighbor };
            steps.push(
                snapshotGraph(
                    graph,
                    visited,
                    [...stack],
                    nodeId,
                    edge,
                    [...order],
                    'consider',
                    `Consider neighbor ${neighbor}`,
                ),
            );
            if (!visited.has(neighbor)) {
                stack.push(neighbor);
                steps.push(
                    snapshotGraph(
                        graph,
                        visited,
                        [...stack],
                        nodeId,
                        edge,
                        [...order],
                        'push',
                        `Push ${neighbor} onto the stack`,
                    ),
                );
            }
        });
    }

    steps.push(
        snapshotGraph(graph, visited, [], null, null, [...order], 'complete', 'DFS traversal complete'),
    );

    return steps;
};

let treeNodeCounter = 0;

const createTreeNode = (value) => ({
    id: `node-${treeNodeCounter += 1}`,
    value,
    left: null,
    right: null,
});

const serializeTree = (node) => {
    if (!node) return null;
    const children = [];
    if (node.left) children.push(serializeTree(node.left));
    if (node.right) children.push(serializeTree(node.right));
    return {
        id: node.id,
        value: node.value,
        children,
    };
};

const snapshotTree = (root, highlights, stage, message) => ({
    mode: 'tree',
    stage,
    message,
    tree: serializeTree(root),
    highlights,
});

const generateBstSteps = (config) => {
    treeNodeCounter = 0;
    let root = null;
    const steps = [];

    config.values.forEach((value, index) => {
        if (!root) {
            root = createTreeNode(value);
            steps.push(
                snapshotTree(root, { inserted: root.id, value }, 'insert', `Insert ${value} as root node`),
            );
            return;
        }

        let current = root;
        let parent = null;
        let direction = null;

        while (current) {
            steps.push(
                snapshotTree(root, { current: current.id, value }, 'compare', `Compare ${value} with ${current.value}`),
            );
            parent = current;
            if (value < current.value) {
                direction = 'left';
                if (!current.left) break;
                current = current.left;
            } else {
                direction = 'right';
                if (!current.right) break;
                current = current.right;
            }
        }

        const newNode = createTreeNode(value);
        if (direction === 'left') {
            parent.left = newNode;
        } else {
            parent.right = newNode;
        }

        steps.push(
            snapshotTree(
                root,
                { current: parent.id, inserted: newNode.id, value },
                'insert',
                `Insert ${value} to the ${direction} of ${parent.value}`,
            ),
        );

        if (index === config.values.length - 1) {
            steps.push(snapshotTree(root, { value }, 'complete', 'BST insertion sequence complete'));
        }
    });

    return steps;
};

const builtinGenerators = {
    'bubble-sort': generateBubbleSortSteps,
    'merge-sort': generateMergeSortSteps,
    'quick-sort': generateQuickSortSteps,
    bfs: generateBfsSteps,
    dfs: generateDfsSteps,
    'bst-insert': generateBstSteps,
};

const runBuiltIn = (algorithmId, config) => {
    const generator = builtinGenerators[algorithmId];
    if (!generator) return { steps: [], summary: {} };
    const steps = generator(config);
    return {
        steps,
        summary: {
            mode: config.type,
            algorithmId,
        },
    };
};

const runJavaScriptSandbox = (code, config) => {
    const sandbox = {
        Math,
        JSON,
        Number,
        String,
        Boolean,
        Array,
        console: { log: () => {} },
        runAlgorithm: undefined,
        module: {},
        exports: {},
    };

    const context = vm.createContext(sandbox, {
        codeGeneration: { strings: false, wasm: false },
    });

    const scriptSource = `'use strict';\n${code}\n`;
    try {
        const script = new vm.Script(scriptSource, { timeout: 500 });
        script.runInContext(context, { timeout: 500 });
    } catch (error) {
        return { error: error.message };
    }

    let runner = context.runAlgorithm;
    if (typeof runner !== 'function') {
        if (typeof context.module?.exports?.runAlgorithm === 'function') {
            runner = context.module.exports.runAlgorithm;
        } else if (typeof context.exports?.runAlgorithm === 'function') {
            runner = context.exports.runAlgorithm;
        }
    }

    if (typeof runner !== 'function') {
        return { error: 'runAlgorithm function was not found in the provided JavaScript code.' };
    }

    const steps = [];
    const emit = (value) => {
        try {
            const normalized = JSON.parse(JSON.stringify(value));
            steps.push(normalized);
        } catch (error) {
            steps.push(value);
        }
    };

    try {
        const summary = runner(JSON.parse(JSON.stringify(config)), emit) || {};
        return { steps, summary };
    } catch (error) {
        return { error: error.message };
    }
};

const getPythonCommand = async () => {
    try {
        await execFileAsync('python3', ['--version']);
        return 'python3';
    } catch (error) {
        try {
            await execFileAsync('python', ['--version']);
            return 'python';
        } catch (err) {
            return null;
        }
    }
};

const runPythonSandbox = async (code, config) => {
    const runnerMode = resolveRunnerMode();
    const dockerImage = process.env.CODE_RUNNER_DOCKER_IMAGE_PYTHON;

    let workDir;
    const script = `import json\nsteps = []\n\nconfig = json.loads(${JSON.stringify(JSON.stringify(config))})\n\n` +
        `${code}\n\n` +
        `if 'run_algorithm' not in globals():\n` +
        `    raise Exception('run_algorithm function was not found in the provided Python code.')\n\n` +
        `def emit(step):\n` +
        `    steps.append(step)\n\n` +
        `summary = run_algorithm(config, emit) or {}\n` +
        `for item in steps:\n` +
        `    print(json.dumps({'type': 'step', 'payload': item}), flush=True)\n` +
        `print(json.dumps({'type': 'summary', 'payload': summary}), flush=True)\n`;

    try {
        ({ workDir } = await createWorkspace({ fsModule: fs, tempDir: TEMP_DIR }));
        const filePath = path.join(workDir, 'visualizer.py');
        await fs.promises.writeFile(filePath, script);

        let stdout = '';
        if (runnerMode === 'docker') {
            const dockerReady = await detectDocker(execFileAsync);
            if (!dockerReady || !dockerImage) {
                return { error: MISSING_PYTHON_DOCKER_MESSAGE };
            }

            const result = await runDocker({
                execFile: execFileAsync,
                image: dockerImage,
                workDir,
                command: ['python3', '-I', '-u', 'visualizer.py'],
                timeoutMs: PYTHON_DOCKER_TIMEOUT_MS,
            });
            stdout = result?.stdout || '';
        } else {
            const pythonCommand = await getPythonCommand();
            if (!pythonCommand) {
                return { error: 'Python runtime is not available on the server.' };
            }

            const result = await execFileAsync(pythonCommand, ['-I', '-u', filePath], {
                timeout: PYTHON_LOCAL_TIMEOUT_MS,
                encoding: 'utf8',
            });
            stdout = result?.stdout || '';
        }

        const steps = [];
        let summary = {};
        stdout
            .split(/\r?\n/)
            .filter(Boolean)
            .forEach((line) => {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.type === 'step') {
                        steps.push(parsed.payload);
                    } else if (parsed.type === 'summary') {
                        summary = parsed.payload || {};
                    }
                } catch (error) {
                    steps.push({ raw: line });
                }
            });

        return { steps, summary };
    } catch (error) {
        return { error: error?.stderr?.toString() || error.message };
    } finally {
        try {
            await cleanupWorkspace({ fsModule: fs, workDir });
        } catch (error) {
            // Ignore cleanup errors
        }
    }
};

const sanitizeStep = (algorithmId, config, step, index) => {
    if (!step || typeof step !== 'object') {
        return { mode: config.type, stage: 'raw', message: 'Unrecognized step payload', raw: step };
    }

    if (config.type === 'sorting') {
        const array = Array.isArray(step.array) ? step.array : config.array;
        const highlights = step.highlights || {};
        return {
            mode: 'sorting',
            array: cloneArray(array),
            stage: step.stage || 'step',
            message: step.message || `Step ${index + 1}`,
            highlights,
        };
    }

    if (config.type === 'graph') {
        return {
            mode: 'graph',
            stage: step.stage || 'step',
            message: step.message || `Graph step ${index + 1}`,
            graph: step.graph || null,
        };
    }

    if (config.type === 'tree') {
        return {
            mode: 'tree',
            stage: step.stage || 'step',
            message: step.message || `Tree step ${index + 1}`,
            tree: step.tree || null,
            highlights: step.highlights || {},
        };
    }

    return {
        mode: config.type || 'generic',
        stage: step.stage || 'step',
        message: step.message || `Step ${index + 1}`,
        raw: step,
    };
};

export const runAlgorithmVisualization = async ({ algorithmId, language, code, params }) => {
    const config = buildConfig(algorithmId, params);

    let result = null;

    if (language === 'javascript' && code) {
        result = runJavaScriptSandbox(code, config);
    } else if (language === 'python' && code) {
        result = await runPythonSandbox(code, config);
    }

    if (!result || result.error || !Array.isArray(result.steps) || result.steps.length === 0) {
        result = runBuiltIn(algorithmId, config);
    }

    const steps = (result.steps || []).map((step, index) => sanitizeStep(algorithmId, config, step, index));

    return {
        steps,
        summary: result.summary || {},
        config,
    };
};
