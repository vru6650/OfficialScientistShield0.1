import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { z } from 'zod';
import FileNode from '../models/fileNode.model.js';
import {
    FILE_UPLOAD_LIMIT_BYTES,
    ensureStorageReady,
    getTmpDir,
} from '../utils/fileManagerUtils.js';
import {
    createFolder,
    deleteNode,
    downloadFile,
    getFolderTree,
    handleFileUpload,
    listDirectory,
    updateNode,
} from '../controllers/fileManager.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { validateRequest } from '../utils/validate.js';
import { objectIdSchema } from '../validators/common.js';

const router = express.Router();

router.use(verifyToken);

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            await ensureStorageReady();
            cb(null, getTmpDir());
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname || '');
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: FILE_UPLOAD_LIMIT_BYTES,
    },
});

const optionalObjectId = z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    objectIdSchema.optional()
);

const optionalObjectIdOrNull = z.preprocess(
    (value) => (value === '' ? null : value),
    z.union([objectIdSchema, z.null()]).optional()
);

const resolveUploadParent = async (req, res, next) => {
    try {
        const { parentId } = req.body ?? {};
        if (!parentId) {
            req.uploadParent = null;
            return next();
        }

        if (!mongoose.Types.ObjectId.isValid(parentId)) {
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(() => {});
            }
            return res.status(400).json({ message: 'Target folder not found' });
        }

        const parent = await FileNode.findById(parentId);
        if (!parent || parent.type !== 'folder') {
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(() => {});
            }
            return res.status(400).json({ message: 'Target folder not found' });
        }
        req.uploadParent = parent;
        return next();
    } catch (error) {
        return next(error);
    }
};

const parentQuerySchema = z.object({
    parentId: optionalObjectId,
}).partial();

const folderBodySchema = z.object({
    name: z.string().trim().min(1),
    parentId: optionalObjectId,
});

const uploadBodySchema = z.object({
    parentId: optionalObjectId,
}).partial();

const nodeParamsSchema = z.object({
    id: objectIdSchema,
});

const updateNodeBodySchema = z.object({
    name: z.string().trim().optional(),
    newParentId: optionalObjectIdOrNull,
}).partial();

router.get('/', validateRequest({ query: parentQuerySchema }), listDirectory);
router.get('/tree', getFolderTree);
router.post('/folder', validateRequest({ body: folderBodySchema }), createFolder);
router.post(
    '/upload',
    upload.single('file'),
    validateRequest({ body: uploadBodySchema }),
    resolveUploadParent,
    handleFileUpload
);
router.patch(
    '/:id',
    validateRequest({ params: nodeParamsSchema, body: updateNodeBodySchema }),
    updateNode
);
router.delete('/:id', validateRequest({ params: nodeParamsSchema }), deleteNode);
router.get('/:id/download', validateRequest({ params: nodeParamsSchema }), downloadFile);

export default router;
