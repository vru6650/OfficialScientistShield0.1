import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import FileNode from '../models/fileNode.model.js';
import { errorHandler } from '../utils/error.js';
import {
    deleteDirectoryIfExists,
    deleteIfExists,
    ensureStorageReady,
    getFoldersDir,
    joinStorageSegments,
    resolveStoragePath,
    sanitizeName,
    streamableUrlForNode,
} from '../utils/fileManagerUtils.js';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const formatNode = (node) => ({
    id: node._id,
    name: node.name,
    type: node.type,
    parentId: node.parent,
    size: node.size,
    mimeType: node.mimeType,
    extension: node.extension,
    updatedAt: node.updatedAt,
    createdAt: node.createdAt,
    previewUrl: streamableUrlForNode(node),
});

const buildBreadcrumbs = async (parent) => {
    const baseCrumbs = [{ id: null, name: 'All Files' }];
    if (!parent) {
        return baseCrumbs;
    }

    if (!parent.ancestors || parent.ancestors.length === 0) {
        return [...baseCrumbs, { id: parent._id, name: parent.name }];
    }

    const ancestorIds = parent.ancestors.map((id) => id.toString());
    const ancestors = await FileNode.find({ _id: { $in: ancestorIds } })
        .select('_id name')
        .lean();
    const map = new Map(ancestors.map((item) => [item._id.toString(), item]));
    const ordered = ancestorIds
        .map((id) => map.get(id))
        .filter(Boolean)
        .map((item) => ({ id: item._id, name: item.name }));

    return [...baseCrumbs, ...ordered, { id: parent._id, name: parent.name }];
};

const updateDescendantAncestors = async (folderId, previousAncestors, newAncestors) => {
    const descendants = await FileNode.find({ ancestors: folderId }).lean();
    if (!descendants.length) {
        return;
    }

    const folderIdString = folderId.toString();
    const prefix = [...previousAncestors, folderIdString];
    const replacement = [...newAncestors, folderIdString];

    await Promise.all(
        descendants.map((node) => {
            const current = node.ancestors.map((ancestorId) => ancestorId.toString());
            const idx = current.findIndex((id) => id === prefix[0]);
            let updatedAncestors;

            if (idx === -1) {
                updatedAncestors = current;
            } else {
                const remainder = current.slice(idx + prefix.length);
                updatedAncestors = [...replacement, ...remainder];
            }

            const parsedAncestors = updatedAncestors.map((value) =>
                new mongoose.Types.ObjectId(value)
            );

            return FileNode.updateOne(
                { _id: node._id },
                {
                    $set: {
                        ancestors: parsedAncestors,
                    },
                }
            );
        })
    );
};

export const listDirectory = async ({ parentId = null }) => {
    await ensureStorageReady();

    let parent = null;
    let filter;

    if (parentId) {
        if (!isValidObjectId(parentId)) {
            throw errorHandler(400, 'Parent folder not found');
        }
        parent = await FileNode.findById(parentId);
        if (!parent) {
            throw errorHandler(404, 'Parent folder not found');
        }
        if (parent.type !== 'folder') {
            throw errorHandler(400, 'Parent must be a folder');
        }
        filter = { parent: parent._id };
    } else {
        filter = { parent: null };
    }

    const items = await FileNode.find(filter)
        .collation({ locale: 'en', strength: 2 })
        .sort({ type: -1, name: 1 })
        .lean();

    const breadcrumbs = await buildBreadcrumbs(parent);

    return {
        parent: parent ? formatNode(parent) : null,
        breadcrumbs,
        items: items.map(formatNode),
    };
};

export const getFolderTree = async () => {
    const folders = await FileNode.find({ type: 'folder' })
        .select('_id name parent ancestors updatedAt')
        .sort({ name: 1 })
        .lean();

    const byParent = new Map();
    folders.forEach((folder) => {
        const parentId = folder.parent ? folder.parent.toString() : null;
        const arr = byParent.get(parentId) || [];
        arr.push({
            id: folder._id,
            name: folder.name,
            parentId: folder.parent,
            updatedAt: folder.updatedAt,
            children: [],
        });
        byParent.set(parentId, arr);
    });

    const attachChildren = (nodes, parentId = null) =>
        (nodes[parentId] || []).map((node) => ({
            ...node,
            children: attachChildren(nodes, node.id.toString()),
        }));

    const normalized = {};
    byParent.forEach((value, key) => {
        normalized[key ?? 'root'] = value;
    });

    const tree = attachChildren(normalized, 'root');

    return {
        root: { id: null, name: 'All Files' },
        folders: tree,
    };
};

export const createFolder = async ({ name, parentId = null }) => {
    await ensureStorageReady();

    const sanitized = sanitizeName(name);

    if (!sanitized) {
        throw errorHandler(400, 'Folder name is required');
    }

    let parent = null;
    if (parentId) {
        if (!isValidObjectId(parentId)) {
            throw errorHandler(400, 'Parent folder not found');
        }
        parent = await FileNode.findById(parentId);
        if (!parent || parent.type !== 'folder') {
            throw errorHandler(400, 'Parent folder not found');
        }
    }

    const duplicate = await FileNode.findOne({
        parent: parent ? parent._id : null,
        name: sanitized,
    })
        .collation({ locale: 'en', strength: 2 })
        .lean();

    if (duplicate) {
        throw errorHandler(409, 'A folder with that name already exists');
    }

    const ancestors = parent ? [...parent.ancestors, parent._id] : [];

    const folder = new FileNode({
        name: sanitized,
        type: 'folder',
        parent: parent ? parent._id : null,
        ancestors,
        storagePath: '',
    });

    folder.storagePath = joinStorageSegments('folders', folder._id.toString());

    await fs.mkdir(path.join(getFoldersDir(), folder._id.toString()), { recursive: true });
    await folder.save();

    return { folder: formatNode(folder) };
};

export const handleFileUpload = async ({ parentId = null, uploadParent = null, file }) => {
    await ensureStorageReady();

    if (parentId && !uploadParent) {
        throw errorHandler(400, 'Parent folder not found');
    }

    if (!file) {
        throw errorHandler(400, 'No file uploaded');
    }

    const originalName = sanitizeName(file.originalname);
    const ext = path.extname(originalName);
    const baseName = sanitizeName(ext ? originalName.slice(0, -ext.length) : originalName) || 'Untitled';
    const extension = ext ? ext.slice(1).toLowerCase() : '';
    const displayName = extension ? `${baseName}.${extension}` : baseName;

    const duplicate = await FileNode.findOne({
        parent: uploadParent ? uploadParent._id : null,
        name: displayName,
    })
        .collation({ locale: 'en', strength: 2 })
        .lean();

    if (duplicate) {
        await fs.unlink(file.path);
        throw errorHandler(409, 'A file with that name already exists');
    }

    const ancestors = uploadParent ? [...uploadParent.ancestors, uploadParent._id] : [];

    const fileNode = new FileNode({
        name: displayName,
        type: 'file',
        parent: uploadParent ? uploadParent._id : null,
        ancestors,
        size: file.size,
        mimeType: file.mimetype,
        extension,
        storagePath: '',
    });

    const finalRelativePath = joinStorageSegments(
        'files',
        extension ? `${fileNode._id.toString()}.${extension}` : fileNode._id.toString()
    );

    try {
        await fs.rename(file.path, resolveStoragePath(finalRelativePath));
    } catch (renameError) {
        await fs.unlink(file.path).catch(() => {});
        throw errorHandler(500, 'Failed to store uploaded file.');
    }

    fileNode.storagePath = finalRelativePath;
    await fileNode.save();

    return { file: formatNode(fileNode) };
};

export const updateNode = async ({ id, name, newParentId }) => {
    if (!isValidObjectId(id)) {
        throw errorHandler(400, 'Invalid item id');
    }

    const node = await FileNode.findById(id);
    if (!node) {
        throw errorHandler(404, 'Item not found');
    }

    let hasChanges = false;
    let parentChanged = false;
    let parent;

    if (typeof newParentId !== 'undefined') {
        if (newParentId) {
            if (!isValidObjectId(newParentId)) {
                throw errorHandler(400, 'Target folder not found');
            }
            parent = await FileNode.findById(newParentId);
            if (!parent || parent.type !== 'folder') {
                throw errorHandler(400, 'Target folder not found');
            }
        } else {
            parent = null;
        }

        if (newParentId && parent && parent.ancestors.map(String).includes(node._id.toString())) {
            throw errorHandler(400, 'Cannot move a folder into its descendant');
        }

        const newParentObjectId = parent ? parent._id : null;
        if ((node.parent ?? null)?.toString() !== (newParentObjectId ?? null)?.toString()) {
            parentChanged = true;
            hasChanges = true;
        }
    } else if (node.parent) {
        parent = await FileNode.findById(node.parent);
    }

    let sanitizedName;
    if (typeof name === 'string') {
        sanitizedName = sanitizeName(name);
        if (!sanitizedName) {
            throw errorHandler(400, 'A valid name is required');
        }

        if (node.type === 'file') {
            const ext = node.extension ? `.${node.extension}` : '';
            if (!sanitizedName.toLowerCase().endsWith(ext.toLowerCase()) && ext) {
                sanitizedName = `${sanitizedName}${ext}`;
            }
        }

        if (sanitizedName !== node.name) {
            hasChanges = true;
        }
    }

    const effectiveParent = parentChanged
        ? parent
        : parent ?? (node.parent ? await FileNode.findById(node.parent) : null);
    const targetParentId = effectiveParent ? effectiveParent._id : null;

    if (hasChanges) {
        const duplicateFilter = {
            parent: targetParentId,
            name: sanitizedName ?? node.name,
            _id: { $ne: node._id },
        };
        const duplicate = await FileNode.findOne(duplicateFilter)
            .collation({ locale: 'en', strength: 2 })
            .lean();
        if (duplicate) {
            throw errorHandler(409, 'Another item with that name already exists here');
        }
    } else {
        return { item: formatNode(node) };
    }

    const oldAncestors = node.ancestors.map((id) => id.toString());
    const newAncestors = parentChanged
        ? effectiveParent
            ? [...effectiveParent.ancestors, effectiveParent._id]
            : []
        : oldAncestors;

    const updates = {};
    if (sanitizedName && sanitizedName !== node.name) {
        updates.name = sanitizedName;
    }
    if (parentChanged) {
        updates.parent = targetParentId;
        updates.ancestors = newAncestors;
    }

    if (Object.keys(updates).length > 0) {
        await FileNode.updateOne({ _id: node._id }, { $set: updates });
    }

    if (parentChanged && node.type === 'folder') {
        await updateDescendantAncestors(node._id, oldAncestors, newAncestors);
    }

    const fresh = await FileNode.findById(node._id);
    return { item: formatNode(fresh) };
};

export const deleteNode = async ({ id }) => {
    if (!isValidObjectId(id)) {
        throw errorHandler(400, 'Item not found');
    }
    const node = await FileNode.findById(id);
    if (!node) {
        throw errorHandler(404, 'Item not found');
    }

    const related = await FileNode.find({
        $or: [{ _id: node._id }, { ancestors: node._id }],
    }).lean();

    const fileNodes = related.filter((item) => item.type === 'file');
    const folderNodes = related.filter((item) => item.type === 'folder');

    await Promise.all(
        fileNodes.map((file) => deleteIfExists(resolveStoragePath(file.storagePath)))
    );

    await Promise.all(
        folderNodes.map((folder) =>
            deleteDirectoryIfExists(path.join(getFoldersDir(), folder._id.toString()))
        )
    );

    await FileNode.deleteMany({ _id: { $in: related.map((item) => item._id) } });

    return { success: true };
};

export const downloadFile = async ({ id }) => {
    if (!isValidObjectId(id)) {
        throw errorHandler(404, 'File not found');
    }
    const node = await FileNode.findById(id);
    if (!node || node.type !== 'file') {
        throw errorHandler(404, 'File not found');
    }

    const absolutePath = resolveStoragePath(node.storagePath);
    return { node, absolutePath };
};
