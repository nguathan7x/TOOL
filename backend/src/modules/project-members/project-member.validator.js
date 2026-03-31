import { z } from 'zod';
import { MEMBERSHIP_STATUS_VALUES } from '../../constants/membership.js';
import { PROJECT_ROLE_VALUES } from '../authorization/authorization.constants.js';
import { objectIdSchema } from '../../shared/validation/object-id.js';

const membershipTargetSchema = z.object({
  userId: objectIdSchema.optional(),
  email: z.string().email().optional(),
  role: z.enum(PROJECT_ROLE_VALUES),
  status: z.enum(MEMBERSHIP_STATUS_VALUES).optional(),
  joinedAt: z.string().datetime().optional()
}).refine((value) => value.userId || value.email, 'Provide userId or email');

export const listProjectMembersSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    projectId: objectIdSchema
  }),
  query: z.object({
    role: z.enum(PROJECT_ROLE_VALUES).optional(),
    status: z.enum(MEMBERSHIP_STATUS_VALUES).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const createProjectMemberSchema = z.object({
  body: membershipTargetSchema,
  params: z.object({
    projectId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const updateProjectMemberSchema = z.object({
  body: z.object({
    role: z.enum(PROJECT_ROLE_VALUES).optional(),
    status: z.enum(MEMBERSHIP_STATUS_VALUES).optional()
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  params: z.object({
    projectId: objectIdSchema,
    membershipId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const projectMemberIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    projectId: objectIdSchema,
    membershipId: objectIdSchema
  }),
  query: z.object({}).default({})
});
