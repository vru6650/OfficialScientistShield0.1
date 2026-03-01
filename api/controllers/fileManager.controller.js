import {
    createFolder as createFolderService,
    deleteNode as deleteNodeService,
    downloadFile as downloadFileService,
    getFolderTree as getFolderTreeService,
    handleFileUpload as handleFileUploadService,
    listDirectory as listDirectoryService,
    updateNode as updateNodeService,
} from '../services/fileManager.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listDirectory = asyncHandler(async (req, res) => {
    const data = await listDirectoryService({ parentId: req.query.parentId ?? null });
    return res.json(data);
});

export const getFolderTree = asyncHandler(async (req, res) => {
    const data = await getFolderTreeService();
    return res.json(data);
});

export const createFolder = asyncHandler(async (req, res) => {
    const data = await createFolderService({
        name: req.body?.name,
        parentId: req.body?.parentId ?? null,
    });
    return res.status(201).json(data);
});

export const handleFileUpload = asyncHandler(async (req, res) => {
    const data = await handleFileUploadService({
        parentId: req.body?.parentId ?? null,
        uploadParent: req.uploadParent ?? null,
        file: req.file,
    });
    return res.status(201).json(data);
});

export const updateNode = asyncHandler(async (req, res) => {
    const data = await updateNodeService({
        id: req.params.id,
        name: req.body?.name,
        newParentId: req.body?.newParentId ?? null,
    });
    return res.json(data);
});

export const deleteNode = asyncHandler(async (req, res) => {
    const data = await deleteNodeService({ id: req.params.id });
    return res.json(data);
});

export const downloadFile = asyncHandler(async (req, res) => {
    const { node, absolutePath } = await downloadFileService({ id: req.params.id });
    res.setHeader('Content-Type', node.mimeType || 'application/octet-stream');
    res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(node.name)}"`
    );
    return res.sendFile(absolutePath);
});
