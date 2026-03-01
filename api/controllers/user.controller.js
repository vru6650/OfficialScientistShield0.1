import { normalizePagination } from '../utils/pagination.js';
import {
    countAllUsers,
    countUsersCreatedAfter,
    deleteUserById,
    findUsersWithPagination,
    getUserById,
    updateUserById,
} from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const test = (req, res) => {
    res.json({ message: 'API is working!' });
};

export const updateUser = asyncHandler(async (req, res) => {
    const updatedUser = await updateUserById(req.params.userId, req.body);
    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
});

export const deleteUser = asyncHandler(async (req, res) => {
    await deleteUserById(req.params.userId);
    res.status(200).json('User has been deleted');
});

export const signout = asyncHandler(async (req, res) => {
    res
        .clearCookie('access_token')
        .status(200)
        .json('User has been signed out');
});

export const getUsers = asyncHandler(async (req, res) => {
    const { startIndex, limit } = normalizePagination(req.query, {
        defaultLimit: 9,
        maxLimit: 50,
    });
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    const users = await findUsersWithPagination(startIndex, limit, sortDirection);

    const totalUsers = await countAllUsers();

    const now = new Date();
    const oneMonthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
    );
    const lastMonthUsers = await countUsersCreatedAfter(oneMonthAgo);

    res.status(200).json({
        users,
        totalUsers,
        lastMonthUsers,
    });
});

export const getUser = asyncHandler(async (req, res) => {
    const user = await getUserById(req.params.userId, { excludePassword: true });
    res.status(200).json(user);
});
