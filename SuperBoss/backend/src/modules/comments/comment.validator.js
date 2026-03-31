import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid object id');

export const listTaskCommentsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    taskId: objectIdSchema
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const createTaskCommentSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1).max(3000)
  }),
  params: z.object({
    taskId: objectIdSchema
  }),
  query: z.object({}).default({})
});
