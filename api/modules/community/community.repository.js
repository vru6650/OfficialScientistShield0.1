import CommunitySubmission from '../../models/communitySubmission.model.js';

export const createSubmissionRecord = async (data) => {
    const submission = new CommunitySubmission(data);
    return submission.save();
};

export const findSubmissions = ({ filters, startIndex, limit }) => {
    return CommunitySubmission.find(filters)
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit)
        .lean();
};

export const countSubmissions = (filters) => {
    return CommunitySubmission.countDocuments(filters);
};

export const updateSubmissionStatus = (id, status) => {
    return CommunitySubmission.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
    ).lean();
};
