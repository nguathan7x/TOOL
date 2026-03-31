import { Router } from 'express';
import { API_PREFIX } from '../constants/app.js';
import { healthController } from '../modules/system/health.controller.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { workspaceRouter } from '../modules/workspaces/workspace.routes.js';
import { workspaceMemberRouter } from '../modules/workspace-members/workspace-member.routes.js';
import { spaceRouter } from '../modules/spaces/space.routes.js';
import { spaceMemberRouter } from '../modules/space-members/space-member.routes.js';
import { projectRouter } from '../modules/projects/project.routes.js';
import { projectMemberRouter } from '../modules/project-members/project-member.routes.js';
import { taskRouter } from '../modules/tasks/task.routes.js';
import { inviteRouter } from '../modules/invites/invite.routes.js';
import { notificationRouter } from '../modules/notifications/notification.routes.js';

const router = Router();

router.get(`${API_PREFIX}/health`, healthController);
router.use(`${API_PREFIX}/auth`, authRouter);
router.use(`${API_PREFIX}/workspaces`, workspaceRouter);
router.use(`${API_PREFIX}/workspaces/:workspaceId/members`, workspaceMemberRouter);
router.use(`${API_PREFIX}/spaces`, spaceRouter);
router.use(`${API_PREFIX}/spaces/:spaceId/members`, spaceMemberRouter);
router.use(`${API_PREFIX}/projects`, projectRouter);
router.use(`${API_PREFIX}/projects/:projectId/members`, projectMemberRouter);
router.use(`${API_PREFIX}/tasks`, taskRouter);
router.use(`${API_PREFIX}/invites`, inviteRouter);
router.use(`${API_PREFIX}/notifications`, notificationRouter);

export { router };


