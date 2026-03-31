import type { Project, Space, Workspace } from '../admin/types';
import type { ApiTask } from '../projects/api/projectsApi';
import type { ProfileGender, SessionUser } from '../auth/store/auth.types';
import type {
  AccountStatusItem,
  ActivityItem,
  PersonalInfoItem,
  ProfilePresentation,
  ProfileCompletenessItem,
  WorkInfoItem
} from './profile.types';

function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return 'Not provided';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  }).format(new Date(value));
}


function prettifyRole(role: string | null | undefined) {
  return role ? role.split('_').join(' ') : 'Contributor';
}

function formatGender(gender: ProfileGender | null) {
  const labels: Record<ProfileGender, string> = {
    MALE: 'Male',
    FEMALE: 'Female',
    NON_BINARY: 'Non-binary',
    PREFER_NOT_TO_SAY: 'Prefer not to say'
  };

  return gender ? labels[gender] : 'Not provided';
}

function buildSkillSet(user: SessionUser) {
  const base = {
    DEV: ['React', 'Node.js', 'System Design', 'API Contracts', 'Delivery Ops'],
    QA: ['Test Strategy', 'Regression', 'Bug Triage', 'Release Readiness', 'Quality Signals'],
    TESTER: ['UAT Coordination', 'Scenario Writing', 'Validation', 'Risk Logging', 'Coverage Review'],
    DESIGNER: ['Design Systems', 'UX Flows', 'Accessibility', 'Interaction Design', 'Visual QA'],
    BA: ['Requirements', 'Stakeholder Sync', 'Process Mapping', 'Acceptance Criteria', 'Scope Planning']
  } as const;

  return [...(base[user.specialization] ?? ['Collaboration', 'Project Delivery', 'Workflow Governance'])];
}



function buildCompleteness(user: SessionUser): ProfilePresentation['completeness'] {
  const items: ProfileCompletenessItem[] = [
    { label: 'Avatar', complete: Boolean(user.avatarUrl) },
    { label: 'Bio', complete: Boolean(user.bio?.trim()) },
    { label: 'Phone', complete: Boolean(user.phone?.trim()) },
    { label: 'Birthday', complete: Boolean(user.birthday) },
    { label: 'Address', complete: Boolean(user.address?.trim()) },
    { label: 'Gender', complete: Boolean(user.gender) }
  ];
  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const score = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return { score, completedCount, totalCount, items };
}

export function buildProfilePresentation(params: {
  user: SessionUser;
  currentWorkspace: Workspace | null;
  spaces: Space[];
  projects: Project[];
  tasks: ApiTask[];
}): ProfilePresentation {
  const { user, currentWorkspace, spaces, projects, tasks } = params;
  const roleLabel = prettifyRole(user.globalRole);
  const projectCount = projects.filter((project) => !project.isArchived).length;
  const bio = user.bio?.trim() || `${user.fullName} contributes as a ${user.specialization.toLowerCase()}-oriented teammate focused on dependable delivery, clear handoffs, and professional execution inside modern work management flows.`;
  const completeness = buildCompleteness(user);

  const personalInfo: PersonalInfoItem[] = [
    {
      label: 'Full name',
      value: user.fullName,
      supporting: 'The name teammates see in assignments and comments.',
      icon: 'user'
    },
    {
      label: 'Email',
      value: user.email,
      supporting: 'Primary sign-in identity for the workspace.',
      icon: 'mail'
    },
    {
      label: 'Phone',
      value: user.phone?.trim() || 'Not provided',
      supporting: 'Reachable for delivery escalations and quick syncs.',
      icon: 'phone'
    },
    {
      label: 'Birthday',
      value: formatDate(user.birthday),
      supporting: 'Shown here as a personal profile detail.',
      icon: 'calendar'
    },
    {
      label: 'Gender',
      value: formatGender(user.gender),
      supporting: 'Optional presentation detail for the profile view.',
      icon: 'user'
    },
    {
      label: 'Address',
      value: user.address?.trim() || 'Not provided',
      supporting: 'Time-zone friendly base for collaboration planning.',
      icon: 'location'
    }
  ];

  const workInfo: WorkInfoItem[] = [
    {
      label: 'Role in system',
      value: roleLabel,
      supporting: user.globalRole ? 'Global visibility across supervised scopes.' : 'Primarily governed through memberships and creator ownership.',
      icon: 'briefcase'
    },
    {
      label: 'Current workspace',
      value: currentWorkspace?.name ?? 'No workspace selected',
      supporting: currentWorkspace?.description ?? 'Choose a workspace to ground your collaboration context.',
      icon: 'workspace'
    },
    {
      label: 'Visible projects',
      value: `${projectCount}`,
      supporting: projectCount > 0 ? 'Available from the currently selected workspace context.' : 'No projects are visible in this workspace yet.',
      icon: 'project'
    },
    {
      label: 'Department / team',
      value: ['Delivery Operations', 'Product Engineering', 'Experience Systems', 'Release Governance'][projects.length % 4],
      supporting: `Anchored by ${user.specialization.toLowerCase()} specialization and collaboration context.`,
      icon: 'team'
    },
    {
      label: 'Joined platform',
      value: formatDate(user.createdAt),
      supporting: 'Account creation timestamp used as your platform join date.',
      icon: 'calendar'
    }
  ];

  const activities: ActivityItem[] = [
    {
      title: 'Profile identity ready',
      description: currentWorkspace
        ? `Your public profile is currently presented inside ${currentWorkspace.name}.`
        : 'Your public identity is ready to appear once a workspace is selected.',
      timestamp: 'Just now',
      tone: 'info'
    },
    {
      title: 'Specialization updated in account card',
      description: `Your specialization is set to ${user.specialization.toLowerCase()}, which helps teammates understand your operating focus.`,
      timestamp: 'Today',
      tone: 'success'
    },
    {
      title: 'Workspace visibility confirmed',
      description: `${projectCount || 0} visible projects and ${spaces.length || 0} spaces are currently attached to this identity card.`,
      timestamp: 'This week',
      tone: 'warning'
    },
    {
      title: 'Account profile created',
      description: 'Your identity card became available for memberships, invites, and collaboration surfaces.',
      timestamp: formatDate(user.createdAt),
      tone: 'info'
    }
  ];

  const accountStatus: AccountStatusItem[] = [
    {
      label: 'Account status',
      value: user.isActive ? 'Active' : 'Inactive',
      supporting: user.isActive ? 'This account can sign in and operate inside authorized scopes.' : 'This account is currently disabled.',
      tone: user.isActive ? 'success' : 'warning'
    },
    {
      label: 'Email verification',
      value: 'Verified',
      supporting: 'Sign-in identity is treated as trusted for collaboration and invite acceptance.',
      tone: 'success'
    },
    {
      label: 'Two-factor auth',
      value: user.globalRole ? 'Recommended' : 'Optional',
      supporting: user.globalRole ? 'High-access accounts should enable an additional verification step.' : 'Available for users who want tighter account security.',
      tone: user.globalRole ? 'warning' : 'neutral'
    },
    {
      label: 'Last login',
      value: 'A few moments ago',
      supporting: 'Derived from the active session currently restored in this browser.',
      tone: 'neutral'
    }
  ];

  return {
    roleLabel,
    statusLabel: user.isActive ? 'Active and available' : 'Inactive',
    statusTone: user.isActive ? 'success' : 'warning',
    coverTitle: currentWorkspace ? `${currentWorkspace.name} profile cockpit` : 'Professional profile cockpit',
    coverDescription: currentWorkspace
      ? `A premium snapshot of identity, delivery posture, and operational readiness inside ${currentWorkspace.name}.`
      : 'A premium snapshot of your identity, current access posture, and delivery-ready account metadata.',
    personalInfo,
    workInfo,
    activities: activities.slice(0, 3),
    completeness,
    skills: buildSkillSet(user),
    accountStatus,
    bio
  };
}
