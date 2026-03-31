import { z } from 'zod';
import { MEMBERSHIP_STATUS_VALUES } from '../../constants/membership.js';
import { SPACE_ROLE_VALUES } from '../authorization/authorization.constants.js';
import { objectIdSchema } from '../../shared/validation/object-id.js';

const membershipTargetSchema = z.object({
  userId: objectIdSchema.optional(),
  email: z.string().email().optional(),
  role: z.enum(SPACE_ROLE_VALUES),
  status: z.enum(MEMBERSHIP_STATUS_VALUES).optional(),
  joinedAt: z.string().datetime().optional()
}).refine((value) => value.userId || value.email, 'Provide userId or email');

export const listSpaceMembersSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    spaceId: objectIdSchema
  }),
  query: z.object({
    role: z.enum(SPACE_ROLE_VALUES).optional(),
    status: z.enum(MEMBERSHIP_STATUS_VALUES).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const createSpaceMemberSchema = z.object({
  body: membershipTargetSchema,
  params: z.object({
    spaceId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const updateSpaceMemberSchema = z.object({
  body: z.object({
    role: z.enum(SPACE_ROLE_VALUES).optional(),
    status: z.enum(MEMBERSHIP_STATUS_VALUES).optional()
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  params: z.object({
    spaceId: objectIdSchema,
    membershipId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const spaceMemberIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    spaceId: objectIdSchema,
    membershipId: objectIdSchema
  }),
  query: z.object({}).default({})
});
