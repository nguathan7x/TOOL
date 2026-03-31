import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid object id');

export const listTaskActivitySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    taskId: objectIdSchema
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});
