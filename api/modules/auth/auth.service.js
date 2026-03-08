import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../../utils/error.js';
import { createAuthUser, findAuthUserByEmail } from './auth.repository.js';

const signToken = (payload) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw errorHandler(500, 'JWT secret is missing');
    }

    return jwt.sign(payload, secret);
};

const toSafeUser = (userDoc) => {
    const source = userDoc?._doc || userDoc || {};
    const { password, ...safeUser } = source;

    return safeUser;
};

export const createUser = createAuthUser;
export const findUserByEmail = findAuthUserByEmail;

export const signupUser = async ({ username, email, password, profilePicture }) => {
    if (
        !username ||
        !email ||
        !password ||
        username === '' ||
        email === '' ||
        password === ''
    ) {
        throw errorHandler(400, 'All fields are required');
    }

    return createAuthUser({
        username,
        email,
        password,
        profilePicture,
    });
};

export const signinUser = async ({ email, password }) => {
    if (!email || !password || email === '' || password === '') {
        throw errorHandler(400, 'All fields are required');
    }

    const validUser = await findAuthUserByEmail(email);

    if (!validUser) {
        throw errorHandler(404, 'User not found');
    }

    const validPassword = await bcryptjs.compare(password, validUser.password);

    if (!validPassword) {
        throw errorHandler(400, 'Invalid password');
    }

    const token = signToken({ id: validUser._id, isAdmin: validUser.isAdmin });
    const rest = toSafeUser(validUser);

    return { token, user: rest };
};

export const signinWithGoogleUser = async ({ email, name, googlePhotoUrl }) => {
    const existingUser = await findAuthUserByEmail(email);

    if (existingUser) {
        const token = signToken({ id: existingUser._id, isAdmin: existingUser.isAdmin });
        const rest = toSafeUser(existingUser);

        return { token, user: rest };
    }

    const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);

    const createdUser = await signupUser({
        username:
            String(name).toLowerCase().split(' ').join('') +
            Math.random().toString(9).slice(-4),
        email,
        password: generatedPassword,
        profilePicture: googlePhotoUrl,
    });

    const token = signToken({ id: createdUser._id, isAdmin: createdUser.isAdmin });
    const rest = toSafeUser(createdUser);

    return { token, user: rest };
};
