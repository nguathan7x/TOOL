import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid object id');

const checklistItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  isCompleted: z.boolean().optional(),
  completedAt: z.string().datetime().nullable().optional()
});

export const createTaskSchema = z.object({
  body: z.object({
    workspaceId: objectIdSchema,
    spaceId: objectIdSchema,
    projectId: objectIdSchema,
    boardListId: objectIdSchema.nullish(),
    parentTaskId: objectIdSchema.nullish(),
    taskType: z.enum(['TASK', 'BUG', 'STORY', 'SPIKE']).optional(),
    title: z.string().trim().min(2).max(240),
    description: z.string().max(5000).optional().default(''),
    status: z.string().trim().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    assigneeId: objectIdSchema.nullish(),
    labels: z.array(z.string().trim().min(1).max(40)).optional(),
    startDate: z.string().datetime().nullish(),
    dueDate: z.string().datetime().nullish(),
    estimateHours: z.number().positive().max(1000).nullish(),
    checklist: z.array(checklistItemSchema).optional(),
    dependencyTaskIds: z.array(objectIdSchema).optional()
  }).refine((value) => !value.startDate || !value.dueDate || new Date(value.startDate).getTime() <= new Date(value.dueDate).getTime(), {
    message: 'Start date must be on or before due date',
    path: ['dueDate']
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const listTasksSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    projectId: objectIdSchema,
    status: z.string().trim().optional(),
    boardListId: objectIdSchema.optional(),
    assigneeId: objectIdSchema.optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const taskIdParamSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    taskId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(240).optional(),
    description: z.string().max(5000).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    labels: z.array(z.string().trim().min(1).max(40)).optional(),
    startDate: z.string().datetime().nullish(),
    dueDate: z.string().datetime().nullish(),
    estimateHours: z.number().positive().max(1000).nullish(),
    checklist: z.array(checklistItemSchema).optional(),
    boardListId: objectIdSchema.nullish(),
    dependencyTaskIds: z.array(objectIdSchema).optional()
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required').refine((value) => !value.startDate || !value.dueDate || new Date(value.startDate).getTime() <= new Date(value.dueDate).getTime(), {
    message: 'Start date must be on or before due date',
    path: ['dueDate']
  }),
  params: z.object({
    taskId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const assignTaskSchema = z.object({
  body: z.object({
    assigneeId: objectIdSchema.nullish()
  }),
  params: z.object({
    taskId: objectIdSchema
  }),
  query: z.object({}).default({})
});

export const reorderTasksSchema = z.object({
  body: z.object({
    projectId: objectIdSchema,
    orderedTaskIds: z.array(objectIdSchema).min(1)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const transitionTaskSchema = z.object({
  body: z.object({
    status: z.string().trim().min(1),
    requireClientApproval: z.boolean().optional(),
    uatApprovedByClient: z.boolean().optional()
  }),
  params: z.object({
    taskId: objectIdSchema
  }),
  query: z.object({}).default({})
});
