import Tutorial from '../../models/tutorial.model.js';

export const createTutorialRecord = async (data) => {
    const tutorial = new Tutorial(data);
    return tutorial.save();
};

export const findTutorialById = (tutorialId) => {
    return Tutorial.findById(tutorialId);
};

export const findTutorials = ({ filters, sortDirection, startIndex, limit }) => {
    return Tutorial.find(filters)
        .sort({ updatedAt: sortDirection })
        .skip(startIndex)
        .limit(limit)
        .lean();
};

export const countTutorials = (filters) => {
    return Tutorial.countDocuments(filters);
};

export const deleteTutorialById = (tutorialId) => {
    return Tutorial.findByIdAndDelete(tutorialId);
};
