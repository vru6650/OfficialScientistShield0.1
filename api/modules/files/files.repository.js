import FileNode from '../../models/fileNode.model.js';

const CASE_INSENSITIVE_COLLATION = { locale: 'en', strength: 2 };

export const findNodeById = (id) => {
    return FileNode.findById(id);
};

export const findNodeByNameInParent = ({ parentId, name, excludeId } = {}) => {
    const filter = {
        parent: parentId ?? null,
        name,
    };

    if (excludeId) {
        filter._id = { $ne: excludeId };
    }

    return FileNode.findOne(filter)
        .collation(CASE_INSENSITIVE_COLLATION)
        .lean();
};

export const findDirectoryItems = (filter) => {
    return FileNode.find(filter)
        .collation(CASE_INSENSITIVE_COLLATION)
        .sort({ type: -1, name: 1 })
        .lean();
};

export const findAncestorNodes = (ancestorIds) => {
    return FileNode.find({ _id: { $in: ancestorIds } })
        .select('_id name')
        .lean();
};

export const findFolders = () => {
    return FileNode.find({ type: 'folder' })
        .select('_id name parent ancestors updatedAt')
        .sort({ name: 1 })
        .lean();
};

export const createNodeRecord = (data) => {
    return new FileNode(data);
};

export const findDescendantNodes = (folderId) => {
    return FileNode.find({ ancestors: folderId }).lean();
};

export const updateNodeById = (id, updates) => {
    return FileNode.updateOne(
        { _id: id },
        {
            $set: updates,
        }
    );
};

export const findNodesForDeletion = (nodeId) => {
    return FileNode.find({
        $or: [{ _id: nodeId }, { ancestors: nodeId }],
    }).lean();
};

export const deleteNodesByIds = (ids) => {
    return FileNode.deleteMany({ _id: { $in: ids } });
};
