import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/object-id.js';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug must use lowercase letters, numbers, and hyphens'),
    description: z.string().max(1000).optional().default('')
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const listWorkspacesSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    search: z.string().trim().optional(),
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const workspaceIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    workspaceId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const updateWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug must use lowercase letters, numbers, and hyphens').optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional()
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  params: z.object({
    workspaceId: objectIdSchema
  }),
  query: z.object({}).default({})
});
