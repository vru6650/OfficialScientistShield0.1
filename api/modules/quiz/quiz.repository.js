import Quiz from '../../models/quiz.model.js';

export const createQuizRecord = async (data) => {
    const quiz = new Quiz(data);
    return quiz.save();
};

export const findQuizzes = ({ filters, sortDirection, startIndex, limit }) => {
    return Quiz.find(filters)
        .sort({ updatedAt: sortDirection })
        .skip(startIndex)
        .limit(limit)
        .populate('createdBy', 'username profilePicture')
        .populate('relatedTutorials', 'title slug')
        .lean();
};

export const countQuizzes = (filters) => {
    return Quiz.countDocuments(filters);
};

export const findQuizById = (quizId, { withRelated = false } = {}) => {
    const query = Quiz.findById(quizId);

    if (withRelated) {
        query
            .populate('createdBy', 'username')
            .populate('relatedTutorials', 'title slug');
    }

    return query;
};

export const findQuizBySlug = (slug) => {
    return Quiz.findOne({ slug })
        .populate('createdBy', 'username')
        .populate('relatedTutorials', 'title slug');
};

export const updateQuizById = (quizId, updateFields) => {
    return Quiz.findByIdAndUpdate(
        quizId,
        { $set: updateFields },
        { new: true }
    );
};

export const deleteQuizById = (quizId) => {
    return Quiz.findByIdAndDelete(quizId);
};
