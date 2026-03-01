import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const ROOT_DIR = path.resolve();
const UPLOAD_ROOT = path.join(ROOT_DIR, 'uploads');
const TMP_DIR = path.join(UPLOAD_ROOT, 'tmp');
const FILES_DIR = path.join(UPLOAD_ROOT, 'files');
const FOLDERS_DIR = path.join(UPLOAD_ROOT, 'folders');

export const FILE_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB

export const ensureStorageReady = async () => {
    if (!existsSync(UPLOAD_ROOT)) {
        await fs.mkdir(UPLOAD_ROOT, { recursive: true });
    }
    if (!existsSync(TMP_DIR)) {
        await fs.mkdir(TMP_DIR, { recursive: true });
    }
    if (!existsSync(FILES_DIR)) {
        await fs.mkdir(FILES_DIR, { recursive: true });
    }
    if (!existsSync(FOLDERS_DIR)) {
        await fs.mkdir(FOLDERS_DIR, { recursive: true });
    }
};

export const getTmpDir = () => TMP_DIR;
export const getFilesDir = () => FILES_DIR;
export const getFoldersDir = () => FOLDERS_DIR;

export const sanitizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

export const resolveStoragePath = (relativePath) => path.join(UPLOAD_ROOT, relativePath);

export const joinStorageSegments = (...segments) =>
    segments
        .flatMap((segment) =>
            segment
                ? segment
                      .toString()
                      .split('/')
                      .filter(Boolean)
                : []
        )
        .join('/');

export const deleteIfExists = async (absolutePath) => {
    try {
        await fs.unlink(absolutePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

export const deleteDirectoryIfExists = async (absolutePath) => {
    try {
        await fs.rm(absolutePath, { recursive: true, force: true });
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

export const streamableUrlForNode = (node) => {
    if (!node || node.type !== 'file') return null;
    return `/api/v1/files/${node._id}/download`;
};
