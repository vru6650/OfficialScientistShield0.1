import test from 'node:test';
import assert from 'node:assert/strict';

import {
    derivePostMediaFields,
    normalizeCoverAssetIndex,
    resolvePostSlug,
    sanitizeIllustrations,
    sanitizeMediaAssets,
} from './post.service.js';

test('resolvePostSlug prefers a custom slug and normalizes it', () => {
    const result = resolvePostSlug({
        requestedSlug: '  Launch Notes: V2  ',
        fallbackTitle: 'Ignored title',
    });

    assert.equal(result, 'launch-notes-v2');
});

test('resolvePostSlug falls back to the title when custom slug is empty', () => {
    const result = resolvePostSlug({
        requestedSlug: '   ',
        fallbackTitle: 'Ship the Create Post Upgrade',
    });

    assert.equal(result, 'ship-the-create-post-upgrade');
});

test('sanitizeMediaAssets removes invalid items and normalizes ordering', () => {
    const result = sanitizeMediaAssets([
        { url: ' https://cdn.example.com/cover.png ', type: 'image', caption: ' Cover ', order: 4 },
        null,
        { url: '', type: 'video' },
        { url: 'https://cdn.example.com/spec.pdf', type: 'document', caption: ' Spec ', order: 1 },
        { url: 'https://cdn.example.com/audio.mp3', type: 'audio' },
    ]);

    assert.deepEqual(result, [
        {
            url: 'https://cdn.example.com/spec.pdf',
            type: 'document',
            caption: 'Spec',
            order: 0,
        },
        {
            url: 'https://cdn.example.com/cover.png',
            type: 'image',
            caption: 'Cover',
            order: 1,
        },
        {
            url: 'https://cdn.example.com/audio.mp3',
            type: 'audio',
            caption: '',
            order: 2,
        },
    ]);
});

test('sanitizeMediaAssets returns an empty list for non-array values', () => {
    assert.deepEqual(sanitizeMediaAssets(undefined), []);
});

test('sanitizeIllustrations trims metadata and normalizes illustration ordering', () => {
    const result = sanitizeIllustrations([
        {
            url: ' https://cdn.example.com/sketch-two.webp ',
            alt: ' Storyboard frame ',
            caption: ' Transition beat ',
            credit: ' Studio Team ',
            order: 4,
        },
        { url: '' },
        {
            url: 'https://cdn.example.com/sketch-one.webp',
            alt: ' Opening visual ',
            caption: ' Intro scene ',
            credit: '  ',
            order: 1,
        },
    ]);

    assert.deepEqual(result, [
        {
            url: 'https://cdn.example.com/sketch-one.webp',
            alt: 'Opening visual',
            caption: 'Intro scene',
            credit: '',
            order: 0,
        },
        {
            url: 'https://cdn.example.com/sketch-two.webp',
            alt: 'Storyboard frame',
            caption: 'Transition beat',
            credit: 'Studio Team',
            order: 1,
        },
    ]);
});

test('sanitizeIllustrations returns an empty list for non-array values', () => {
    assert.deepEqual(sanitizeIllustrations(undefined), []);
});

test('normalizeCoverAssetIndex clamps to the available media asset range', () => {
    const mediaAssets = sanitizeMediaAssets([
        { url: 'https://cdn.example.com/one.png', type: 'image' },
        { url: 'https://cdn.example.com/two.mp4', type: 'video' },
    ]);

    assert.equal(
        normalizeCoverAssetIndex({ mediaAssets, requestedCoverAssetIndex: 9 }),
        1,
    );
    assert.equal(
        normalizeCoverAssetIndex({ mediaAssets, requestedCoverAssetIndex: -3 }),
        0,
    );
});

test('derivePostMediaFields clears stale preview fields when media assets are removed', () => {
    const result = derivePostMediaFields({
        mediaAssets: [],
        coverAssetIndex: 0,
    });

    assert.deepEqual(result, {
        coverAssetIndex: 0,
        mediaUrl: null,
        mediaType: 'image',
        image: null,
    });
});

test('derivePostMediaFields falls back to the first image asset for non-image covers', () => {
    const mediaAssets = sanitizeMediaAssets([
        { url: 'https://cdn.example.com/cover.png', type: 'image' },
        { url: 'https://cdn.example.com/demo.mp4', type: 'video' },
    ]);

    const result = derivePostMediaFields({
        mediaAssets,
        coverAssetIndex: 1,
    });

    assert.deepEqual(result, {
        coverAssetIndex: 1,
        mediaUrl: 'https://cdn.example.com/demo.mp4',
        mediaType: 'video',
        image: 'https://cdn.example.com/cover.png',
    });
});
