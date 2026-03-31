import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid object id');
const emailSchema = z.string().trim().email();

export const createInviteSchema = z.object({
  body: z.object({
    scopeType: z.enum(['WORKSPACE', 'SPACE', 'PROJECT']),
    scopeId: objectIdSchema,
    email: emailSchema,
    role: z.string().trim().min(1),
    message: z.string().trim().max(1000).optional().default('')
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const listInvitesSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    scopeType: z.enum(['WORKSPACE', 'SPACE', 'PROJECT']).optional(),
    scopeId: objectIdSchema.optional(),
    status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const inviteIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({ inviteId: objectIdSchema }),
  query: z.object({}).default({})
});
