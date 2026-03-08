import Comment from '../../models/comment.model.js';

export const createCommentRecord = async (data) => {
    const comment = new Comment(data);
    return comment.save();
};

export const findCommentsByPostId = (postId) => {
    return Comment.find({ postId }).sort({ createdAt: -1 });
};

export const findCommentById = (commentId) => {
    return Comment.findById(commentId);
};

export const updateCommentById = (commentId, updates) => {
    return Comment.findByIdAndUpdate(commentId, updates, { new: true });
};

export const deleteCommentById = (commentId) => {
    return Comment.findByIdAndDelete(commentId);
};

export const findComments = ({ sortDirection, startIndex, limit }) => {
    return Comment.find()
        .sort({ createdAt: sortDirection })
        .skip(startIndex)
        .limit(limit)
        .lean();
};

export const countComments = (filters = {}) => {
    return Comment.countDocuments(filters);
};
