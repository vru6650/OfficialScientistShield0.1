import mongoose from 'mongoose';

const communitySubmissionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        role: { type: String, trim: true },
        experienceLevel: { type: String, trim: true },
        goals: { type: String, trim: true },
        interests: { type: [String], default: () => [] },
        message: { type: String, trim: true },
        status: {
            type: String,
            enum: ['new', 'reviewing', 'contacted', 'closed'],
            default: 'new',
        },
        consentToContact: { type: Boolean, default: false },
        source: { type: String, trim: true, default: 'community-form' },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

communitySubmissionSchema.index({ createdAt: -1 });
communitySubmissionSchema.index({ status: 1, createdAt: -1 });
communitySubmissionSchema.index({ email: 1, createdAt: -1 });

const CommunitySubmission = mongoose.model('CommunitySubmission', communitySubmissionSchema);

export default CommunitySubmission;
