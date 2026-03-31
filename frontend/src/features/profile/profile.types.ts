export type PersonalInfoItem = {
  label: string;
  value: string;
  supporting?: string;
  icon: 'mail' | 'phone' | 'calendar' | 'user' | 'location' | 'spark';
};

export type WorkInfoItem = {
  label: string;
  value: string;
  supporting?: string;
  icon: 'briefcase' | 'workspace' | 'project' | 'team' | 'calendar';
};

export type ActivityItem = {
  title: string;
  description: string;
  timestamp: string;
  tone: 'info' | 'success' | 'warning';
};


export type ProfileCompletenessItem = {
  label: string;
  complete: boolean;
};

export type AccountStatusItem = {
  label: string;
  value: string;
  supporting: string;
  tone: 'success' | 'warning' | 'neutral';
};

export type ProfilePresentation = {
  roleLabel: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'neutral';
  coverTitle: string;
  coverDescription: string;
  personalInfo: PersonalInfoItem[];
  workInfo: WorkInfoItem[];
  activities: ActivityItem[];
  completeness: {
    score: number;
    completedCount: number;
    totalCount: number;
    items: ProfileCompletenessItem[];
  };
  skills: string[];
  accountStatus: AccountStatusItem[];
  bio: string;
};
