import { z } from 'zod';
import { objectIdSchema } from '../../shared/validation/object-id.js';

export const listMyNotificationsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    unreadOnly: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const notificationIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({ notificationId: objectIdSchema }),
  query: z.object({}).default({})
});
