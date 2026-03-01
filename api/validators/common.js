import { z } from 'zod';

export const objectIdSchema = z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const optionalObjectIdSchema = objectIdSchema.optional();

export const nonEmptyStringSchema = z.string().trim().min(1, 'Required');

export const optionalTrimmedStringSchema = z.string().trim().optional();

export const slugSchema = z.string().trim().min(1, 'Slug is required');

export const paginationQuerySchema = z
    .object({
        startIndex: z.coerce.number().int().min(0).optional(),
        limit: z.coerce.number().int().min(1).optional(),
    })
    .partial();
