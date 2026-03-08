import { asyncHandler } from '../../utils/asyncHandler.js';
import { signinUser, signinWithGoogleUser, signupUser } from './auth.service.js';

const AUTH_COOKIE_NAME = 'access_token';

export const signup = asyncHandler(async (req, res) => {
    await signupUser(req.body || {});
    res.json('Signup successful');
});

export const signin = asyncHandler(async (req, res) => {
    const { token, user } = await signinUser(req.body || {});

    res
        .status(200)
        .cookie(AUTH_COOKIE_NAME, token, {
            httpOnly: true,
        })
        .json(user);
});

export const google = asyncHandler(async (req, res) => {
    const { token, user } = await signinWithGoogleUser(req.body || {});

    res
        .status(200)
        .cookie(AUTH_COOKIE_NAME, token, {
            httpOnly: true,
        })
        .json(user);
});
