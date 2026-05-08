import Problem from '../../models/problem.model.js';

export const createProblemRecord = async (data) => {
    const problem = new Problem(data);
    return problem.save();
};

export const findProblems = ({ filters, sort, startIndex, limit }) => {
    return Problem.find(filters)
        .sort(sort)
        .skip(startIndex)
        .limit(limit)
        .lean();
};

export const countProblems = (filters) => {
    return Problem.countDocuments(filters);
};

export const aggregateProblemTopicCounts = (filters) => {
    return Problem.aggregate([
        { $match: filters },
        { $unwind: { path: '$topics', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$topics', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
    ]);
};

export const aggregateProblemDifficultyCounts = (filters) => {
    return Problem.aggregate([
        { $match: filters },
        {
            $group: {
                _id: '$difficulty',
                count: { $sum: 1 },
            },
        },
    ]);
};

export const findProblemBySlug = (slug) => {
    return Problem.findOne({ slug })
        .populate('createdBy', 'username profilePicture role');
};

export const findProblemById = (problemId, { withCreatedBy = false } = {}) => {
    const query = Problem.findById(problemId);

    if (withCreatedBy) {
        query.populate('createdBy', 'username profilePicture role');
    }

    return query;
};

export const deleteProblemById = (problemId) => {
    return Problem.findByIdAndDelete(problemId);
};
