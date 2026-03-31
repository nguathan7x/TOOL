import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid object id');
const projectLifecycleStatusSchema = z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']);
const dateFieldSchema = z.union([z.coerce.date(), z.null()]).optional();

const statusColumnSchema = z.object({
  key: z.string().trim().min(1),
  name: z.string().trim().min(1),
  color: z.string().trim().optional(),
  position: z.number().int().min(0)
});

const workflowTransitionSchema = z.object({
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  allowedRoles: z.array(z.string().trim().min(1)).optional()
});

function hasInvalidLifecycleWindow(value) {
  if (!value.startDate || !value.targetEndDate) {
    return false;
  }

  return value.startDate.getTime() > value.targetEndDate.getTime();
}

export const createProjectSchema = z.object({
  body: z.object({
    workspaceId: objectIdSchema,
    spaceId: objectIdSchema,
    name: z.string().trim().min(2).max(120),
    key: z.string().trim().min(2).max(20),
    description: z.string().max(1000).optional().default(''),
    statusColumns: z.array(statusColumnSchema).min(1),
    workflowTransitions: z.array(workflowTransitionSchema).min(1),
    supportedTaskTypes: z.array(z.enum(['TASK', 'BUG', 'STORY', 'SPIKE'])).optional(),
    defaultTaskType: z.enum(['TASK', 'BUG', 'STORY', 'SPIKE']).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const listProjectsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    workspaceId: objectIdSchema,
    spaceId: objectIdSchema.optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const projectIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    projectId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().max(1000).optional(),
    status: projectLifecycleStatusSchema.optional(),
    startDate: dateFieldSchema,
    targetEndDate: dateFieldSchema,
    completedAt: dateFieldSchema,
    archivedAt: dateFieldSchema,
    completionNote: z.string().max(2000).optional(),
    statusColumns: z.array(statusColumnSchema).min(1).optional(),
    workflowTransitions: z.array(workflowTransitionSchema).min(1).optional(),
    supportedTaskTypes: z.array(z.enum(['TASK', 'BUG', 'STORY', 'SPIKE'])).optional(),
    defaultTaskType: z.enum(['TASK', 'BUG', 'STORY', 'SPIKE']).optional(),
    isArchived: z.boolean().optional()
  })
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
    .refine((value) => !hasInvalidLifecycleWindow(value), {
      message: 'Target end date must be on or after the start date'
    }),
  params: z.object({
    projectId: objectIdSchema
  }),
  query: z.object({}).default({})
});
