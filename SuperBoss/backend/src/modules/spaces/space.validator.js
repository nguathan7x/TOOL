import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/object-id.js';

export const createSpaceSchema = z.object({
  body: z.object({
    workspaceId: objectIdSchema,
    name: z.string().trim().min(2).max(120),
    key: z.string().trim().min(2).max(24).regex(/^[A-Za-z0-9_-]+$/, 'Space key must use letters, numbers, hyphens, or underscores'),
    description: z.string().max(1000).optional().default('')
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const listSpacesSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    workspaceId: objectIdSchema,
    search: z.string().trim().optional(),
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const spaceIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    spaceId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const updateSpaceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    key: z.string().trim().min(2).max(24).regex(/^[A-Za-z0-9_-]+$/, 'Space key must use letters, numbers, hyphens, or underscores').optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional()
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  params: z.object({
    spaceId: objectIdSchema
  }),
  query: z.object({}).default({})
});
