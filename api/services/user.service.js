import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

/**
 * Retrieves a user by ID.
 *
 * @param {string} userId - The user identifier.
 * @param {Object} [options]
 * @param {boolean} [options.excludePassword=false] - Exclude the password field from the result.
 * @returns {Promise<Object|null>} The user document or null if not found.
 */
export const getUserById = async (userId, { excludePassword = false } = {}) => {
    const query = User.findById(userId);
    if (excludePassword) {
        query.select('-password');
    }
    const user = await query;
    if (!user) {
        throw errorHandler(404, 'User not found');
    }
    return user;
};

/**
 * Updates a user's properties and saves the document.
 *
 * @param {string} userId - The user identifier.
 * @param {Object} updates - Fields to update.
 * @returns {Promise<Object|null>} The updated user document or null if not found.
 */
export const updateUserById = async (userId, updates = {}) => {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
        throw errorHandler(404, 'User not found');
    }

    const { username, email, password, profilePicture } = updates;

    if (username) {
        userToUpdate.username = username;
    }
    if (email) {
        userToUpdate.email = email;
    }
    if (typeof password === 'string' && password.trim() !== '') {
        if (typeof userToUpdate.isModified === 'function') {
            // Let Mongoose middleware hash the password to avoid double hashing
            userToUpdate.password = password;
        } else {
            userToUpdate.password = await bcryptjs.hash(password, 10);
        }
    }
    if (profilePicture) {
        userToUpdate.profilePicture = profilePicture;
    }

    try {
        return await userToUpdate.save();
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A user with this ${field} already exists`);
        }
        throw error;
    }
};

/**
 * Deletes a user by ID.
 *
 * @param {string} userId - The user identifier.
 * @returns {Promise<Object|null>} The result of the deletion operation.
 */
export const deleteUserById = async (userId) => {
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
        throw errorHandler(404, 'User not found');
    }
    return deleted;
};

/**
 * Retrieves users with pagination and sorting.
 *
 * @param {number} startIndex - Number of records to skip.
 * @param {number} limit - Number of records to return.
 * @param {number} sortDirection - Sort direction (1 for asc, -1 for desc).
 * @returns {Promise<Array>} The list of users.
 */
export const findUsersWithPagination = (startIndex, limit, sortDirection) => {
    return User.find()
        .sort({ createdAt: sortDirection })
        .skip(startIndex)
        .limit(limit)
        .select('-password');
};

/**
 * Counts all users in the collection.
 *
 * @returns {Promise<number>} The number of users.
 */
export const countAllUsers = () => {
    return User.countDocuments();
};

/**
 * Counts users created after a specific date.
 *
 * @param {Date} date - The start date.
 * @returns {Promise<number>} The number of users created after the date.
 */
export const countUsersCreatedAfter = (date) => {
    return User.countDocuments({
        createdAt: { $gte: date },
    });
};
