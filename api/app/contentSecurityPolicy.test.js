import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
    collectInlineScriptHashes,
    createContentSecurityPolicyDirectives,
} from './contentSecurityPolicy.js';

test('collectInlineScriptHashes hashes inline scripts and ignores external scripts', () => {
    const html = `
        <html>
            <head>
                <script>
                    window.__BOOT__ = true;
                </script>
                <script src="/assets/index.js"></script>
            </head>
        </html>
    `;

    const expectedScript = `
                    window.__BOOT__ = true;
                `;
    const expectedHash = crypto.createHash('sha256').update(expectedScript, 'utf8').digest('base64');

    assert.deepEqual(collectInlineScriptHashes(html), [`'sha256-${expectedHash}'`]);
});

test('createContentSecurityPolicyDirectives allows the external resources used by the SPA', () => {
    const directives = createContentSecurityPolicyDirectives({
        inlineScriptHashes: ["'sha256-inline-bootstrap'"],
    });

    assert.deepEqual(directives.scriptSrc, [
        "'self'",
        'https:',
        "'sha256-inline-bootstrap'",
    ]);
    assert.deepEqual(directives.connectSrc, [
        "'self'",
        'https:',
        'ws:',
        'wss:',
    ]);
    assert.deepEqual(directives.imgSrc, [
        "'self'",
        'https:',
        'data:',
        'blob:',
    ]);
    assert.deepEqual(directives.mediaSrc, [
        "'self'",
        'https:',
        'data:',
        'blob:',
    ]);
    assert.deepEqual(directives.frameSrc, [
        "'self'",
        'https:',
    ]);
    assert.deepEqual(directives.workerSrc, [
        "'self'",
        'blob:',
    ]);
});
