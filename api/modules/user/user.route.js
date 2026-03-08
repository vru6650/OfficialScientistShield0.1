import express from 'express';
import { z } from 'zod';
import {
    deleteUser,
    getUser,
    getUsers,
    signout,
    test,
    updateUser,
} from './user.controller.js';
import { requireAdmin, requireSelf, requireSelfOrAdmin } from '../../utils/authorize.js';
import { validateRequest } from '../../utils/validate.js';
import { objectIdSchema, paginationQuerySchema } from '../../validators/common.js';
import { verifyToken } from '../../utils/verifyUser.js';

const router = express.Router();

const userIdParams = z.object({
    userId: objectIdSchema,
});

const updateUserBody = z.object({}).passthrough();
const getUsersQuery = paginationQuerySchema
    .extend({
        sort: z.enum(['asc', 'desc']).optional(),
    })
    .partial();

router.get('/test', test);
router.put(
    '/update/:userId',
    verifyToken,
    validateRequest({ params: userIdParams, body: updateUserBody }),
    requireSelf('userId', 'You are not allowed to update this user'),
    updateUser
);
router.delete(
    '/delete/:userId',
    verifyToken,
    validateRequest({ params: userIdParams }),
    requireSelfOrAdmin('userId', 'You are not allowed to delete this user'),
    deleteUser
);
router.post('/signout', signout);
router.get(
    '/getusers',
    verifyToken,
    requireAdmin('You are not allowed to see all users'),
    validateRequest({ query: getUsersQuery }),
    getUsers
);
router.get('/:userId', validateRequest({ params: userIdParams }), getUser);

export default router;
