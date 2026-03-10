import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
            unique: true,
        },
        image: {
            type: String,
            default:
                'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png',
        },
        mediaUrl: {
            type: String,
            default: null,
        },
        mediaType: {
            type: String,
            default: 'image',
        },
        mediaAssets: {
            type: [
                {
                    url: { type: String, required: true },
                    type: {
                        type: String,
                        enum: ['image', 'video', 'audio', 'document'],
                        default: 'image',
                    },
                    caption: { type: String, default: '' },
                    order: { type: Number, default: 0 },
                },
            ],
            default: () => [],
        },
        coverAssetIndex: { type: Number, default: 0 },
        category: {
            type: String,
            default: 'uncategorized',
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        // --- NEW FIELDS FOR CLAP FEATURE ---
        claps: {
            type: Number,
            default: 0,
        },
        clappedBy: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'User',
            default: [],
        },

        bookmarkedBy: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'User',
            default: [],
        },
        kind: {
            type: String,
            enum: ['article', 'community'],
            default: 'article',
            index: true,
        },
        // --- END OF NEW FIELDS ---
    },
    { timestamps: true }
);

postSchema.index({ category: 1, updatedAt: -1 });
postSchema.index({ userId: 1, updatedAt: -1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
