import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

/**
 * Creates and persists a new user document.
 *
 * @param {Object} userData - Data used to create the user.
 * @returns {Promise<Object>} The saved user document.
 */
export const createUser = async (userData) => {
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

/**
 * Finds a user by email address.
 *
 * @param {string} email - The email to search for.
 * @returns {Promise<Object|null>} The matching user document or null.
 */
export const findUserByEmail = (email) => {
  return User.findOne({ email });
};
