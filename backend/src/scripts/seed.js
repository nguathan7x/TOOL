import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  DEFAULT_PASSWORD,
  demoAuditEntries,
  demoBoardLists,
  demoNotifications,
  demoProject,
  demoProjectRoles,
  demoSpace,
  demoSpaceRoles,
  demoStatusColumns,
  demoTasks,
  demoUsers,
  demoWorkflowTransitions,
  demoWorkspace,
  demoWorkspaceRoles
} from '../../../shared/demo/demo-data.mjs';
import { connectDatabase } from '../config/database.js';
import { MEMBERSHIP_STATUS } from '../constants/membership.js';
import { TASK_TYPES } from '../constants/task.js';
import { User } from '../modules/users/user.model.js';
import { Workspace } from '../modules/workspaces/workspace.model.js';
import { WorkspaceMember } from '../modules/workspace-members/workspace-member.model.js';
import { Space } from '../modules/spaces/space.model.js';
import { SpaceMember } from '../modules/space-members/space-member.model.js';
import { Project } from '../modules/projects/project.model.js';
import { ProjectMember } from '../modules/project-members/project-member.model.js';
import { BoardList } from '../modules/board-lists/board-list.model.js';
import { Task } from '../modules/tasks/task.model.js';
import { Comment } from '../modules/comments/comment.model.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { AuditLog } from '../modules/audit-logs/audit-log.model.js';

async function upsertUser(definition, passwordHash) {
  return User.findOneAndUpdate(
    { email: definition.email },
    {
      $set: {
        fullName: definition.fullName,
        email: definition.email,
        passwordHash,
        globalRole: definition.globalRole,
        userType: definition.userType,
        specialization: definition.specialization,
        isActive: true
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertWorkspaceMember(userId, workspaceId, role) {
  return WorkspaceMember.findOneAndUpdate(
    { userId, workspaceId },
    {
      $set: {
        role,
        status: MEMBERSHIP_STATUS.ACTIVE,
        joinedAt: new Date('2026-01-01T08:00:00.000Z')
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertSpaceMember(userId, workspaceId, spaceId, role) {
  return SpaceMember.findOneAndUpdate(
    { userId, spaceId },
    {
      $set: {
        workspaceId,
        role,
        status: MEMBERSHIP_STATUS.ACTIVE,
        joinedAt: new Date('2026-01-02T08:00:00.000Z')
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertProjectMember(userId, workspaceId, spaceId, projectId, role) {
  return ProjectMember.findOneAndUpdate(
    { userId, projectId },
    {
      $set: {
        workspaceId,
        spaceId,
        role,
        status: MEMBERSHIP_STATUS.ACTIVE,
        joinedAt: new Date('2026-01-03T08:00:00.000Z')
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertBoardList(workspaceId, spaceId, projectId, seed) {
  return BoardList.findOneAndUpdate(
    { projectId, key: seed.key },
    {
      $set: {
        workspaceId,
        spaceId,
        projectId,
        name: seed.name,
        key: seed.key,
        position: seed.position,
        kind: seed.kind,
        color: seed.color
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertTask(seed) {
  return Task.findOneAndUpdate(
    { projectId: seed.projectId, sequenceNumber: seed.sequenceNumber },
    { $set: seed },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertComment(seed) {
  return Comment.findOneAndUpdate(
    { taskId: seed.taskId, authorId: seed.authorId, content: seed.content },
    { $set: seed },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertNotification(seed) {
  return Notification.findOneAndUpdate(
    { userId: seed.userId, entityId: seed.entityId, type: seed.type, title: seed.title },
    { $set: seed },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertAuditLog(seed) {
  return AuditLog.findOneAndUpdate(
    { entityId: seed.entityId, action: seed.action, user: seed.user },
    { $set: seed },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seed() {
  await connectDatabase();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const users = {};

  for (const definition of demoUsers) {
    users[definition.key] = await upsertUser(definition, passwordHash);
  }

  const workspace = await Workspace.findOneAndUpdate(
    { slug: demoWorkspace.slug },
    {
      $set: {
        name: demoWorkspace.name,
        slug: demoWorkspace.slug,
        description: demoWorkspace.description,
        createdBy: users[demoWorkspace.creatorKey].id,
        isActive: true
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const space = await Space.findOneAndUpdate(
    { workspaceId: workspace.id, key: demoSpace.key },
    {
      $set: {
        workspaceId: workspace.id,
        name: demoSpace.name,
        key: demoSpace.key,
        description: demoSpace.description,
        createdBy: users[demoSpace.creatorKey].id,
        isActive: true
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const project = await Project.findOneAndUpdate(
    { spaceId: space.id, key: demoProject.key },
    {
      $set: {
        workspaceId: workspace.id,
        spaceId: space.id,
        name: demoProject.name,
        key: demoProject.key,
        description: demoProject.description,
        createdBy: users[demoProject.creatorKey].id,
        statusColumns: demoStatusColumns,
        workflowTransitions: demoWorkflowTransitions,
        supportedTaskTypes: [TASK_TYPES.TASK, TASK_TYPES.BUG, TASK_TYPES.STORY],
        defaultTaskType: TASK_TYPES.TASK,
        isArchived: false
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Promise.all(
    Object.entries(demoWorkspaceRoles).map(([userKey, role]) =>
      upsertWorkspaceMember(users[userKey].id, workspace.id, role)
    )
  );

  await upsertWorkspaceMember(users[demoWorkspace.creatorKey].id, workspace.id, 'WORKSPACE_ADMIN');

  await Promise.all(
    Object.entries(demoSpaceRoles).map(([userKey, role]) =>
      upsertSpaceMember(users[userKey].id, workspace.id, space.id, role)
    )
  );

  await upsertSpaceMember(users[demoSpace.creatorKey].id, workspace.id, space.id, 'OWNER');

  await Promise.all(
    Object.entries(demoProjectRoles).map(([userKey, role]) =>
      upsertProjectMember(users[userKey].id, workspace.id, space.id, project.id, role)
    )
  );

  await upsertProjectMember(users[demoProject.creatorKey].id, workspace.id, space.id, project.id, 'PROJECT_ADMIN');

  const boardLists = {};
  for (const seedColumn of demoBoardLists) {
    boardLists[seedColumn.key] = await upsertBoardList(workspace.id, space.id, project.id, seedColumn);
  }

  const tasks = {};
  for (const seedTask of demoTasks) {
    tasks[seedTask.sequenceNumber] = await upsertTask({
      workspaceId: workspace.id,
      spaceId: space.id,
      projectId: project.id,
      boardListId: boardLists[seedTask.status].id,
      parentTaskId: null,
      taskType: seedTask.taskType,
      title: seedTask.title,
      description: seedTask.description,
      createdBy: users[seedTask.createdByKey ?? seedTask.reporterKey].id,
      status: seedTask.status,
      priority: seedTask.priority,
      assigneeId: seedTask.assigneeKey ? users[seedTask.assigneeKey].id : null,
      reporterId: users[seedTask.reporterKey].id,
      labels: seedTask.labels,
      dueDate: seedTask.dueDate ? new Date(seedTask.dueDate) : null,
      checklist: seedTask.checklist.map((item) => ({
        title: item.title,
        isCompleted: item.isCompleted,
        completedAt: item.isCompleted ? new Date() : null
      })),
      dependencyTaskIds: [],
      sequenceNumber: seedTask.sequenceNumber
    });
  }

  for (const seedTask of demoTasks) {
    const dependencyIds = seedTask.dependencies.map((sequenceNumber) => tasks[sequenceNumber].id);
    tasks[seedTask.sequenceNumber] = await upsertTask({
      workspaceId: workspace.id,
      spaceId: space.id,
      projectId: project.id,
      boardListId: boardLists[seedTask.status].id,
      parentTaskId: null,
      taskType: seedTask.taskType,
      title: seedTask.title,
      description: seedTask.description,
      createdBy: users[seedTask.createdByKey ?? seedTask.reporterKey].id,
      status: seedTask.status,
      priority: seedTask.priority,
      assigneeId: seedTask.assigneeKey ? users[seedTask.assigneeKey].id : null,
      reporterId: users[seedTask.reporterKey].id,
      labels: seedTask.labels,
      dueDate: seedTask.dueDate ? new Date(seedTask.dueDate) : null,
      checklist: seedTask.checklist.map((item) => ({
        title: item.title,
        isCompleted: item.isCompleted,
        completedAt: item.isCompleted ? new Date() : null
      })),
      dependencyTaskIds: dependencyIds,
      sequenceNumber: seedTask.sequenceNumber
    });

    for (const comment of seedTask.comments) {
      await upsertComment({
        workspaceId: workspace.id,
        spaceId: space.id,
        projectId: project.id,
        taskId: tasks[seedTask.sequenceNumber].id,
        authorId: users[comment.authorKey].id,
        content: comment.content
      });
    }
  }

  await Promise.all(
    demoNotifications.map((item) =>
      upsertNotification({
        userId: users[item.userKey].id,
        type: item.type,
        title: item.title,
        message: item.message,
        entity: 'Task',
        entityId: tasks[item.taskSequenceNumber].id,
        isRead: false
      })
    )
  );

  await Promise.all(
    demoAuditEntries.map((entry) =>
      upsertAuditLog({
        workspaceId: workspace.id,
        spaceId: space.id,
        projectId: project.id,
        user: users[entry.userKey].id,
        action: entry.action,
        entity: 'Task',
        entityId: tasks[entry.taskSequenceNumber].id,
        before: entry.before,
        after: entry.after,
        timestamp: new Date(entry.timestamp)
      })
    )
  );

  console.log('Seed completed successfully.');
  console.log(`Workspace: ${workspace.name}`);
  console.log(`Space: ${space.name}`);
  console.log(`Project: ${project.name}`);
  console.log(`Users seeded: ${Object.keys(users).length}`);
  console.log(`Default password: ${DEFAULT_PASSWORD}`);
}

seed()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
