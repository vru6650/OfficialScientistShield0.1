import User from '../../models/user.model.js';
import { errorHandler } from '../../utils/error.js';

export const createAuthUser = async (userData) => {
    const newUser = new User(userData);

    try {
        return await newUser.save();
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A user with this ${field} already exists`);
        }

        throw error;
    }
};

export const findAuthUserByEmail = (email) => {
    return User.findOne({ email });
};
