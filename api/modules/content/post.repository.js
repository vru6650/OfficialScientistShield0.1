import Post from '../../models/post.model.js';

export const createPostRecord = async (data) => {
    const post = new Post(data);
    return post.save();
};

export const findPosts = ({ filters, sortOptions, startIndex, limit }) => {
    return Post.find(filters)
        .sort(sortOptions)
        .skip(startIndex)
        .limit(limit)
        .lean();
};

export const countPosts = (filters) => {
    return Post.countDocuments(filters);
};

export const findPostById = (postId) => {
    return Post.findById(postId);
};

export const deletePostById = (postId) => {
    return Post.findByIdAndDelete(postId);
};

export const updatePostById = (postId, updateFields) => {
    return Post.findByIdAndUpdate(
        postId,
        { $set: updateFields },
        { new: true }
    );
};
