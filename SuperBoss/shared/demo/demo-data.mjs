export const DEFAULT_PASSWORD = 'Password123!';

export const demoUsers = [
  { key: 'superAdmin', fullName: 'Avery System', email: 'superadmin@superboss.dev', globalRole: 'SUPER_ADMIN', userType: 'INTERNAL', specialization: 'BA' },
  { key: 'workspaceAdmin', fullName: 'Nina Ops', email: 'workspace-admin@superboss.dev', userType: 'INTERNAL', specialization: 'BA' },
  { key: 'spaceOwner', fullName: 'Liam Product', email: 'owner@superboss.dev', userType: 'INTERNAL', specialization: 'BA' },
  { key: 'pm', fullName: 'Mia Project', email: 'pm@superboss.dev', userType: 'INTERNAL', specialization: 'BA' },
  { key: 'projectAdmin', fullName: 'Leo Lead', email: 'lead@superboss.dev', userType: 'INTERNAL', specialization: 'DEV' },
  { key: 'developerOne', fullName: 'Ivy Nguyen', email: 'dev1@superboss.dev', userType: 'INTERNAL', specialization: 'DEV' },
  { key: 'developerTwo', fullName: 'Noah Tran', email: 'dev2@superboss.dev', userType: 'INTERNAL', specialization: 'DEV' },
  { key: 'qa', fullName: 'Quinn Tester', email: 'qa@superboss.dev', userType: 'INTERNAL', specialization: 'QA' },
  { key: 'viewer', fullName: 'Vera Observer', email: 'viewer@superboss.dev', userType: 'EXTERNAL_SUPPORT', specialization: 'DESIGNER' },
  { key: 'client', fullName: 'Chloe Client', email: 'client@superboss.dev', userType: 'CLIENT', specialization: 'BA' }
];

export const demoWorkspace = {
  slug: 'nova-digital',
  name: 'Nova Digital Delivery',
  description: 'Demo workspace for structured cross-functional delivery.',
  creatorKey: 'workspaceAdmin'
};

export const demoSpace = {
  key: 'CLIENTOPS',
  name: 'Client Ops',
  description: 'Primary delivery space for client implementation and release readiness.',
  creatorKey: 'spaceOwner'
};

export const demoProject = {
  key: 'ALPHA',
  name: 'Alpha Launch Control',
  description: 'Demo project covering the full delivery lifecycle from planning to UAT and done.',
  creatorKey: 'projectAdmin'
};

export const demoStatusColumns = [
  { key: 'BACKLOG', name: 'Backlog', color: '#7DD3FC', position: 1 },
  { key: 'PLANNED', name: 'Planned', color: '#CBD5E1', position: 2 },
  { key: 'IN_PROGRESS', name: 'In Progress', color: '#60A5FA', position: 3 },
  { key: 'REVIEW', name: 'Review', color: '#A78BFA', position: 4 },
  { key: 'QA', name: 'QA', color: '#F59E0B', position: 5 },
  { key: 'UAT', name: 'UAT', color: '#14B8A6', position: 6 },
  { key: 'DONE', name: 'Done', color: '#22C55E', position: 7 }
];

export const demoWorkflowTransitions = [
  { from: 'BACKLOG', to: 'PLANNED', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'PLANNED', to: 'IN_PROGRESS', allowedRoles: ['PROJECT_ADMIN', 'PM', 'MEMBER'] },
  { from: 'IN_PROGRESS', to: 'REVIEW', allowedRoles: ['PROJECT_ADMIN', 'PM', 'MEMBER'] },
  { from: 'REVIEW', to: 'QA', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'QA', to: 'UAT', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'UAT', to: 'DONE', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'REVIEW', to: 'IN_PROGRESS', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'QA', to: 'IN_PROGRESS', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'UAT', to: 'IN_PROGRESS', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'PLANNED', to: 'BACKLOG', allowedRoles: ['PROJECT_ADMIN', 'PM'] }
];

export const demoBoardLists = demoStatusColumns.map((column) => ({
  key: column.key,
  name: column.name,
  position: column.position,
  kind: 'STATUS',
  color: column.color
}));

export const demoWorkspaceRoles = {
  workspaceAdmin: 'WORKSPACE_ADMIN',
  spaceOwner: 'WORKSPACE_MEMBER',
  pm: 'WORKSPACE_MEMBER',
  projectAdmin: 'WORKSPACE_MEMBER',
  developerOne: 'WORKSPACE_MEMBER',
  developerTwo: 'WORKSPACE_MEMBER',
  qa: 'WORKSPACE_MEMBER',
  viewer: 'WORKSPACE_VIEWER',
  client: 'WORKSPACE_VIEWER'
};

export const demoSpaceRoles = {
  spaceOwner: 'OWNER',
  workspaceAdmin: 'ADMIN',
  pm: 'ADMIN',
  projectAdmin: 'MEMBER',
  developerOne: 'MEMBER',
  developerTwo: 'MEMBER',
  qa: 'MEMBER',
  viewer: 'GUEST',
  client: 'GUEST'
};

export const demoProjectRoles = {
  projectAdmin: 'PROJECT_ADMIN',
  pm: 'PM',
  developerOne: 'MEMBER',
  developerTwo: 'MEMBER',
  qa: 'MEMBER',
  viewer: 'VIEWER',
  client: 'VIEWER',
  spaceOwner: 'VIEWER'
};

export const demoTasks = [
  {
    sequenceNumber: 1,
    taskType: 'STORY',
    title: 'Finalize delivery plan and sprint scope',
    description: 'PM prepares the initial scope, timeline, and owner alignment for the release.',
    createdByKey: 'spaceOwner',
    status: 'PLANNED',
    priority: 'HIGH',
    assigneeKey: 'pm',
    reporterKey: 'spaceOwner',
    labels: ['planning', 'scope'],
    dueDate: '2026-04-02',
    checklist: [
      { title: 'Confirm scope', isCompleted: false },
      { title: 'Validate milestones', isCompleted: false }
    ],
    dependencies: [],
    comments: [
      { id: 'C-1', authorKey: 'spaceOwner', content: 'We need this plan to be clear enough for the client handoff.', createdAt: '2026-03-20T10:00:00Z' }
    ],
    activity: [
      { id: 'A-1', text: 'Task created by Liam Product', at: '2026-03-20T09:30:00Z' }
    ]
  },
  {
    sequenceNumber: 2,
    taskType: 'TASK',
    title: 'Build workspace and permissions matrix screens',
    description: 'Core delivery work is actively being implemented by engineering.',
    createdByKey: 'pm',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    assigneeKey: 'developerOne',
    reporterKey: 'pm',
    labels: ['frontend', 'authz'],
    dueDate: '2026-04-04',
    checklist: [
      { title: 'Implement layout', isCompleted: true },
      { title: 'Wire access states', isCompleted: false }
    ],
    dependencies: [],
    comments: [
      { id: 'C-2', authorKey: 'pm', content: 'Please keep assignment controls strict. This task is our demo centerpiece.', createdAt: '2026-03-21T08:10:00Z' }
    ],
    activity: [
      { id: 'A-2', text: 'Assigned to Ivy Nguyen by Mia Project', at: '2026-03-21T07:40:00Z' },
      { id: 'A-3', text: 'Status moved to In Progress', at: '2026-03-21T07:45:00Z' }
    ]
  },
  {
    sequenceNumber: 3,
    taskType: 'BUG',
    title: 'Fix project member leakage in restricted views',
    description: 'A bug fix is waiting for senior review before QA.',
    createdByKey: 'projectAdmin',
    status: 'REVIEW',
    priority: 'HIGH',
    assigneeKey: 'developerTwo',
    reporterKey: 'projectAdmin',
    labels: ['bug', 'security'],
    dueDate: '2026-04-01',
    checklist: [
      { title: 'Add regression coverage', isCompleted: true },
      { title: 'Document root cause', isCompleted: true }
    ],
    dependencies: [],
    comments: [],
    activity: [{ id: 'A-4', text: 'Ready for review by Leo Lead', at: '2026-03-22T11:30:00Z' }]
  },
  {
    sequenceNumber: 4,
    taskType: 'TASK',
    title: 'Validate assignment audit trail end-to-end',
    description: 'QA is validating whether assignment and status changes are fully traceable.',
    createdByKey: 'pm',
    status: 'QA',
    priority: 'MEDIUM',
    assigneeKey: 'qa',
    reporterKey: 'pm',
    labels: ['qa', 'audit'],
    dueDate: '2026-04-05',
    checklist: [
      { title: 'Run QA script', isCompleted: true },
      { title: 'Verify audit entries', isCompleted: true }
    ],
    dependencies: [3],
    comments: [
      { id: 'C-3', authorKey: 'qa', content: 'QA evidence attached. Audit log now shows assign and transition events cleanly.', createdAt: '2026-03-23T14:45:00Z' }
    ],
    activity: [{ id: 'A-5', text: 'Moved from Review to QA by Mia Project', at: '2026-03-23T13:40:00Z' }]
  },
  {
    sequenceNumber: 5,
    taskType: 'STORY',
    title: 'Prepare client walkthrough for controlled UAT',
    description: 'Client-facing UAT handoff is in progress and awaiting client sign-off.',
    createdByKey: 'spaceOwner',
    status: 'UAT',
    priority: 'HIGH',
    assigneeKey: 'pm',
    reporterKey: 'spaceOwner',
    labels: ['uat', 'client'],
    dueDate: '2026-04-06',
    checklist: [
      { title: 'Share release notes', isCompleted: true },
      { title: 'Demo permission behavior', isCompleted: true }
    ],
    dependencies: [],
    comments: [
      { id: 'C-4', authorKey: 'client', content: 'UAT flow looks clear. We can proceed once final reviewer notes are closed.', createdAt: '2026-03-24T09:15:00Z' }
    ],
    activity: [{ id: 'A-6', text: 'Moved from QA to UAT by Mia Project', at: '2026-03-24T08:30:00Z' }]
  },
  {
    sequenceNumber: 6,
    taskType: 'TASK',
    title: 'Release access-controlled project board to stakeholders',
    description: 'Completed delivery item proving the final structured workflow.',
    createdByKey: 'pm',
    status: 'DONE',
    priority: 'MEDIUM',
    assigneeKey: 'projectAdmin',
    reporterKey: 'pm',
    labels: ['release'],
    dueDate: '2026-03-30',
    checklist: [
      { title: 'Production smoke check', isCompleted: true },
      { title: 'Stakeholder notification', isCompleted: true }
    ],
    dependencies: [],
    comments: [],
    activity: [{ id: 'A-7', text: 'Released to stakeholders', at: '2026-03-19T17:10:00Z' }]
  }
];

export const demoNotifications = [
  { userKey: 'developerOne', type: 'task.assigned', title: 'Task assigned', message: 'You were assigned the implementation task for workspace and permission screens.', taskSequenceNumber: 2 },
  { userKey: 'qa', type: 'task.status_changed', title: 'Task moved to QA', message: 'Assignment audit trail validation is ready for QA execution.', taskSequenceNumber: 4 },
  { userKey: 'client', type: 'task.status_changed', title: 'Task moved to UAT', message: 'Client walkthrough preparation is now awaiting your UAT participation.', taskSequenceNumber: 5 }
];

export const demoAuditEntries = [
  { userKey: 'pm', action: 'task.assign', taskSequenceNumber: 2, before: { assigneeKey: null, status: 'PLANNED' }, after: { assigneeKey: 'developerOne', status: 'IN_PROGRESS' }, timestamp: '2026-02-10T09:00:00.000Z' },
  { userKey: 'projectAdmin', action: 'task.transition', taskSequenceNumber: 3, before: { status: 'IN_PROGRESS' }, after: { status: 'REVIEW' }, timestamp: '2026-02-12T14:30:00.000Z' },
  { userKey: 'pm', action: 'task.transition', taskSequenceNumber: 5, before: { status: 'QA' }, after: { status: 'UAT' }, timestamp: '2026-02-15T11:15:00.000Z' }
];
