import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { EmptyState } from '../components/ui/EmptyState';
import { Drawer } from '../components/ui/Drawer';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { Project, Space, Workspace } from '../features/admin/types';
import { getStoredWorkspaceId, resolveWorkspaceSelection } from '../features/workspaces/store/workspaceSelection';
import type { ProfileGender, SessionUser } from '../features/auth/store/auth.types';
import { ActivityTimeline } from '../features/profile/components/ActivityTimeline';
import { ProfileHeader } from '../features/profile/components/ProfileHeader';
import { EditProfileCard, PasswordSecurityCard } from '../features/profile/components/ProfileEditPanels';
import { PersonalInfoCard, ProfessionalIdentityCard } from '../features/profile/components/InfoCards';
import { ProfileCompletenessCard } from '../features/profile/components/SkillsAndStatusCards';
import { buildProfilePresentation } from '../features/profile/profile.utils';
import { type ApiTask } from '../features/projects/api/projectsApi';
import { loadVisibleWorkGraph } from '../features/workspaces/api/visible-work-graph';

const specializationOptions: Array<SessionUser['specialization']> = ['DEV', 'QA', 'TESTER', 'DESIGNER', 'BA'];
const genderOptions: Array<{ value: ProfileGender | ''; label: string }> = [
  { value: '', label: 'Prefer not to say' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }
];
const MAX_STATIC_AVATAR_UPLOAD_SIZE = 8 * 1024 * 1024;
const MAX_ANIMATED_AVATAR_UPLOAD_SIZE = 12 * 1024 * 1024;
const TARGET_AVATAR_DATA_URL_LENGTH = 450_000;
const MAX_AVATAR_DIMENSION = 640;
const MAX_ANIMATED_AVATAR_DATA_URL_LENGTH = 11_500_000;

function isStrongPassword(password: string) {
  return /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read the selected image.'));
    };
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to process the selected image.'));
    };

    image.src = objectUrl;
  });
}

async function optimizeAvatarFile(file: File) {
  if (file.type === 'image/gif') {
    const dataUrl = await readFileAsDataUrl(file);

    if (dataUrl.length > MAX_ANIMATED_AVATAR_DATA_URL_LENGTH) {
      throw new Error('This GIF is too large to keep animated. Please choose a smaller GIF or shorten its duration.');
    }

    return dataUrl;
  }

  if (file.size <= TARGET_AVATAR_DATA_URL_LENGTH / 2) {
    return readFileAsDataUrl(file);
  }

  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to process the selected image.');
  }

  let width = image.width;
  let height = image.height;

  if (width > MAX_AVATAR_DIMENSION || height > MAX_AVATAR_DIMENSION) {
    const scale = Math.min(MAX_AVATAR_DIMENSION / width, MAX_AVATAR_DIMENSION / height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/webp';

  for (const quality of [0.9, 0.82, 0.74, 0.66, 0.58]) {
    const dataUrl = canvas.toDataURL(mimeType, quality);

    if (dataUrl.length <= TARGET_AVATAR_DATA_URL_LENGTH) {
      return dataUrl;
    }
  }

  const smallerCanvas = document.createElement('canvas');
  const smallerContext = smallerCanvas.getContext('2d');

  if (!smallerContext) {
    throw new Error('Unable to process the selected image.');
  }

  const reducedWidth = Math.max(160, Math.round(width * 0.75));
  const reducedHeight = Math.max(160, Math.round(height * 0.75));
  smallerCanvas.width = reducedWidth;
  smallerCanvas.height = reducedHeight;
  smallerContext.drawImage(image, 0, 0, reducedWidth, reducedHeight);

  const fallbackDataUrl = smallerCanvas.toDataURL('image/webp', 0.6);

  if (fallbackDataUrl.length <= TARGET_AVATAR_DATA_URL_LENGTH) {
    return fallbackDataUrl;
  }

  throw new Error('This image is still too large after optimization. Please choose a smaller photo.');
}

export function ProfilePage() {
  const { user, tokens, isBootstrapping, updateProfile, changePassword } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState<SessionUser['specialization']>('DEV');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<ProfileGender | ''>('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'profile' | 'security' | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFullName(user.fullName);
    setSpecialization(user.specialization);
    setPhone(user.phone ?? '');
    setBirthday(user.birthday ? user.birthday.slice(0, 10) : '');
    setGender(user.gender ?? '');
    setAddress(user.address ?? '');
    setBio(user.bio ?? '');
    setAvatarPreview(user.avatarUrl);
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function loadScope() {
      if (!tokens?.accessToken) {
        setWorkspaces([]);
        setSpaces([]);
        setProjects([]);
        return;
      }

      try {
        const graph = await loadVisibleWorkGraph(tokens.accessToken);
        if (cancelled) {
          return;
        }

        const visibleWorkspaces = graph.workspaces;
        setWorkspaces(visibleWorkspaces);
        setWorkspaceError(null);

        const selectedId = resolveWorkspaceSelection(visibleWorkspaces, getStoredWorkspaceId());

        if (!selectedId) {
          setSpaces([]);
          setProjects([]);
          setTasks([]);
          return;
        }

        if (!cancelled) {
          setSpaces(graph.spaces.filter((space) => space.workspaceId === selectedId));
          setProjects(graph.projects.filter((project) => project.workspaceId === selectedId));
          setTasks(graph.tasks.filter((task) => task.workspaceId === selectedId));
        }
      } catch (error) {
        if (!cancelled) {
          setWorkspaceError(error instanceof Error ? error.message : 'Failed to load profile workspace context');
          setSpaces([]);
          setProjects([]);
          setTasks([]);
        }
      }
    }

    loadScope();

    return () => {
      cancelled = true;
    };
  }, [tokens?.accessToken]);

  const currentWorkspace = useMemo(() => {
    const selectedId = getStoredWorkspaceId();
    const resolvedId = resolveWorkspaceSelection(workspaces, selectedId);
    return workspaces.find((workspace) => workspace.id === resolvedId) ?? null;
  }, [workspaces]);

  const presentation = useMemo(
    () =>
      user
        ? buildProfilePresentation({
            user,
            currentWorkspace,
            spaces,
            projects,
            tasks
          })
        : null,
    [currentWorkspace, projects, spaces, tasks, user]
  );

  const hasChanges = user ? (
    fullName.trim() !== user.fullName ||
    specialization !== user.specialization ||
    phone.trim() !== (user.phone ?? '') ||
    birthday !== (user.birthday ? user.birthday.slice(0, 10) : '') ||
    gender !== (user.gender ?? '') ||
    address.trim() !== (user.address ?? '') ||
    bio.trim() !== (user.bio ?? '') ||
    avatarPreview !== user.avatarUrl
  ) : false;
  const hasPasswordChanges = currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFormSuccess(null);
      setFormError('Please choose an image file for your avatar.');
      event.target.value = '';
      return;
    }

    const maxUploadSize = file.type === 'image/gif' ? MAX_ANIMATED_AVATAR_UPLOAD_SIZE : MAX_STATIC_AVATAR_UPLOAD_SIZE;

    if (file.size > maxUploadSize) {
      setFormSuccess(null);
      setFormError(file.type === 'image/gif' ? 'Animated GIF avatars must be 12 MB or smaller.' : 'Avatar image must be 8 MB or smaller before optimization.');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await optimizeAvatarFile(file);
      setAvatarPreview(dataUrl);
      setFormError(null);
      setFormSuccess('Avatar prepared successfully. Save changes to apply it to your account.');
    } catch (error) {
      setFormSuccess(null);
      setFormError(error instanceof Error ? error.message : 'Unable to load the selected image');
    } finally {
      event.target.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    const trimmedBio = bio.trim();

    if (trimmedFullName.length < 2) {
      setFormSuccess(null);
      setFormError('Full name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await updateProfile({
        fullName: trimmedFullName,
        specialization,
        avatarUrl: avatarPreview,
        phone: trimmedPhone || null,
        birthday: birthday || null,
        gender: gender || null,
        address: trimmedAddress || null,
        bio: trimmedBio || null
      });
      setFormSuccess('Your profile has been updated.');
      setActiveDrawer('profile');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to update your profile');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordSuccess(null);
      setPasswordError('Fill in all password fields before submitting.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordSuccess(null);
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setPasswordSuccess(null);
      setPasswordError('Use uppercase, lowercase, a number, and a special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordSuccess(null);
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Your password has been changed and your session has been refreshed.');
      setActiveDrawer('security');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change your password');
    } finally {
      setIsChangingPassword(false);
    }
  }

  function handleReset() {
    if (!user) {
      return;
    }

    setFullName(user.fullName);
    setSpecialization(user.specialization);
    setPhone(user.phone ?? '');
    setBirthday(user.birthday ? user.birthday.slice(0, 10) : '');
    setGender(user.gender ?? '');
    setAddress(user.address ?? '');
    setBio(user.bio ?? '');
    setAvatarPreview(user.avatarUrl);
    setFormError(null);
    setFormSuccess(null);
  }

  function handlePasswordReset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null);
    setFormError(null);
    setFormSuccess(null);
  }

  if (isBootstrapping) {
    return <EmptyState title="Loading profile" description="We are restoring your current session and workspace context." />;
  }

  if (!user || !presentation) {
    return <EmptyState title="No active session" description="Sign in to see your profile, scope, and account metadata." />;
  }

  return (
    <>
      <div className="space-y-6 pb-8">
        <ProfileHeader
          fullName={user.fullName}
          email={user.email}
          avatarUrl={user.avatarUrl}
          roleLabel={presentation.roleLabel}
          statusLabel={presentation.statusLabel}
          statusTone={presentation.statusTone}
          coverTitle={presentation.coverTitle}
          coverDescription={presentation.coverDescription}
          specialization={user.specialization}
          currentWorkspace={currentWorkspace?.name ?? 'No workspace selected'}
          onEditProfile={() => setActiveDrawer('profile')}
          onOpenSecurity={() => setActiveDrawer('security')}
        />


        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
          <div className="space-y-6">
            <PersonalInfoCard bio={presentation.bio} items={presentation.personalInfo} />
            <ActivityTimeline items={presentation.activities} />
          </div>

          <div className="space-y-6">
            <ProfessionalIdentityCard items={presentation.workInfo} />
            <ProfileCompletenessCard
              score={presentation.completeness.score}
              completedCount={presentation.completeness.completedCount}
              totalCount={presentation.completeness.totalCount}
              items={presentation.completeness.items}
            />
          </div>
        </div>

        {workspaceError ? (
          <div className="rounded-[1.5rem] border border-rose-400/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {workspaceError}
          </div>
        ) : null}
      </div>

      <Drawer
        open={activeDrawer === 'profile'}
        onClose={() => setActiveDrawer(null)}
        eyebrow="Profile controls"
        title="Edit profile"
        subtitle="Refine your public identity, avatar, and specialization without leaving the executive profile view."
      >
        <EditProfileCard
          fullName={fullName}
          email={user.email}
          specialization={specialization}
          phone={phone}
          birthday={birthday}
          gender={gender}
          address={address}
          bio={bio}
          userType={user.userType}
          globalRole={user.globalRole}
          avatarPreview={avatarPreview}
          avatarDisplayName={fullName || user.fullName}
          specializationOptions={specializationOptions}
          genderOptions={genderOptions}
          avatarInputRef={avatarInputRef}
          hasChanges={hasChanges}
          isSaving={isSaving}
          formError={formError}
          formSuccess={formSuccess}
          onSubmit={handleSubmit}
          onNameChange={setFullName}
          onSpecializationChange={setSpecialization}
          onPhoneChange={setPhone}
          onBirthdayChange={setBirthday}
          onGenderChange={setGender}
          onAddressChange={setAddress}
          onBioChange={setBio}
          onAvatarChange={handleAvatarChange}
          onChooseAvatar={() => avatarInputRef.current?.click()}
          onRemoveAvatar={handleRemoveAvatar}
          onReset={handleReset}
        />
      </Drawer>

      <Drawer
        open={activeDrawer === 'security'}
        onClose={() => setActiveDrawer(null)}
        eyebrow="Security controls"
        title="Security settings"
        subtitle="Rotate your password, keep access strong, and manage account protection from a dedicated side panel."
      >
        <PasswordSecurityCard
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordError={passwordError}
          passwordSuccess={passwordSuccess}
          hasPasswordChanges={hasPasswordChanges}
          isChangingPassword={isChangingPassword}
          onSubmit={handlePasswordSubmit}
          onCurrentPasswordChange={setCurrentPassword}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onReset={handlePasswordReset}
        />
      </Drawer>
    </>
  );
}
