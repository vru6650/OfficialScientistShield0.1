import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const INLINE_SCRIPT_PATTERN = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

export const collectInlineScriptHashes = (html) => {
    if (typeof html !== 'string' || html.length === 0) {
        return [];
    }

    const hashes = new Set();

    for (const match of html.matchAll(INLINE_SCRIPT_PATTERN)) {
        const scriptContent = match[1] ?? '';

        if (!scriptContent.trim()) {
            continue;
        }

        const hash = crypto.createHash('sha256').update(scriptContent, 'utf8').digest('base64');
        hashes.add(`'sha256-${hash}'`);
    }

    return [...hashes];
};

export const readInlineScriptHashes = (clientDistDir) => {
    try {
        const indexHtml = fs.readFileSync(path.join(clientDistDir, 'index.html'), 'utf8');
        return collectInlineScriptHashes(indexHtml);
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            console.warn('Unable to read client/dist/index.html for CSP hash generation.', error);
        }

        return [];
    }
};

export const createContentSecurityPolicyDirectives = ({ inlineScriptHashes = [] } = {}) => ({
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc: ["'self'", 'https:', 'ws:', 'wss:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    frameSrc: ["'self'", 'https:'],
    imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
    mediaSrc: ["'self'", 'https:', 'data:', 'blob:'],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'", 'https:', ...inlineScriptHashes],
    scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
    workerSrc: ["'self'", 'blob:'],
});
