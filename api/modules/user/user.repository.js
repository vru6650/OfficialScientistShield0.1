import User from '../../models/user.model.js';

export const findUserById = (userId, { excludePassword = false } = {}) => {
    const query = User.findById(userId);

    if (excludePassword) {
        query.select('-password');
    }

    return query;
};

export const deleteUserById = (userId) => {
    return User.findByIdAndDelete(userId);
};

export const findUsersWithPagination = (startIndex, limit, sortDirection) => {
    return User.find()
        .sort({ createdAt: sortDirection })
        .skip(startIndex)
        .limit(limit)
        .select('-password');
};

export const countAllUsers = () => {
    return User.countDocuments();
};

export const countUsersCreatedAfter = (date) => {
    return User.countDocuments({
        createdAt: { $gte: date },
    });
};
