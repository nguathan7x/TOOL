import type { ChangeEvent, FormEvent, RefObject, TextareaHTMLAttributes } from 'react';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { PasswordField } from '../../auth/components/PasswordField';
import { PasswordStrengthMeter } from '../../auth/components/PasswordStrengthMeter';
import type { ProfileGender, SessionUser } from '../../auth/store/auth.types';
import { cn } from '../../../lib/cn';

type EditProfileCardProps = {
  fullName: string;
  email: string;
  specialization: SessionUser['specialization'];
  phone: string;
  birthday: string;
  gender: ProfileGender | '';
  address: string;
  bio: string;
  userType: SessionUser['userType'];
  globalRole: string | null;
  avatarPreview: string | null;
  avatarDisplayName: string;
  specializationOptions: Array<SessionUser['specialization']>;
  genderOptions: Array<{ value: ProfileGender | ''; label: string }>;
  avatarInputRef: RefObject<HTMLInputElement>;
  hasChanges: boolean;
  isSaving: boolean;
  formError: string | null;
  formSuccess: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  onNameChange: (value: string) => void;
  onSpecializationChange: (value: SessionUser['specialization']) => void;
  onPhoneChange: (value: string) => void;
  onBirthdayChange: (value: string) => void;
  onGenderChange: (value: ProfileGender | '') => void;
  onAddressChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  onChooseAvatar: () => void;
  onRemoveAvatar: () => void;
  onReset: () => void;
};

type PasswordSecurityCardProps = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string | null;
  passwordSuccess: string | null;
  hasPasswordChanges: boolean;
  isChangingPassword: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onReset: () => void;
};

function formatUserTypeLabel(userType: SessionUser['userType']) {
  return userType.split('_').join(' ');
}

function Textarea({ className, label, hint, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
      {label ? <span>{label}</span> : null}
      <textarea
        className={cn(
          'min-h-[120px] rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-[#10241a] outline-none transition placeholder:text-[#9fb0c6] focus:border-[#8f9cff] focus:ring-4 focus:ring-[#8f9cff]/15',
          className
        )}
        {...props}
      />
      {hint ? <span className="text-xs font-normal text-slate-300">{hint}</span> : null}
    </label>
  );
}

export function EditProfileCard(props: EditProfileCardProps) {
  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Profile management</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Edit profile details</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">Update your public-facing identity and the dossier details teammates use to understand how to work with you.</p>

      <form className="mt-6 space-y-5" onSubmit={props.onSubmit}>
        <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-4 sm:flex-row sm:items-center">
          <Avatar name={props.avatarDisplayName} src={props.avatarPreview} size="lg" className="h-16 w-16 text-lg" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-white">Profile photo</p>
            <p className="text-sm text-slate-300">Choose a photo up to 8 MB or an animated GIF up to 12 MB. Photos are optimized automatically, while GIFs stay animated when they fit.</p>
            <div className="flex flex-wrap gap-3">
              <input
                ref={props.avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={props.onAvatarChange}
              />
              <Button type="button" onClick={props.onChooseAvatar}>
                Choose avatar
              </Button>
              <Button type="button" variant="secondary" onClick={props.onRemoveAvatar} disabled={!props.avatarPreview}>
                Remove avatar
              </Button>
            </div>
          </div>
        </div>

        <Textarea
          label="Bio"
          value={props.bio}
          onChange={(event) => props.onBioChange(event.target.value)}
          placeholder="Write a short introduction teammates can read in your profile."
          maxLength={600}
          hint="Visible in your profile overview and useful for workspace collaboration context."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={props.fullName} onChange={(event) => props.onNameChange(event.target.value)} placeholder="Your full name" maxLength={120} />
          <Input label="Email" value={props.email} readOnly disabled hint="Email is your sign-in identity and cannot be edited here." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Specialization" value={props.specialization} onChange={(event) => props.onSpecializationChange(event.target.value as SessionUser['specialization'])}>
            {props.specializationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Input label="Phone" value={props.phone} onChange={(event) => props.onPhoneChange(event.target.value)} placeholder="Optional phone number" maxLength={32} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Birthday" type="date" value={props.birthday} onChange={(event) => props.onBirthdayChange(event.target.value)} />
          <Select label="Gender" value={props.gender} onChange={(event) => props.onGenderChange(event.target.value as ProfileGender | '')}>
            {props.genderOptions.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input label="Address" value={props.address} onChange={(event) => props.onAddressChange(event.target.value)} placeholder="City, country or mailing address" maxLength={180} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="User type" value={formatUserTypeLabel(props.userType)} readOnly disabled />
          <Input label="Global access" value={props.globalRole ?? 'No global role'} readOnly disabled />
        </div>

        {props.formError ? <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{props.formError}</p> : null}
        {props.formSuccess ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{props.formSuccess}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={!props.hasChanges || props.isSaving}>
            {props.isSaving ? 'Saving profile...' : 'Save changes'}
          </Button>
          <Button type="button" variant="secondary" disabled={!props.hasChanges || props.isSaving} onClick={props.onReset}>
            Reset
          </Button>
        </div>
      </form>
    </section>
  );
}

export function PasswordSecurityCard(props: PasswordSecurityCardProps) {
  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Security controls</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Change password</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">Keep access strong with a fresh password. Current-password verification and session rotation are built in.</p>

      <form className="mt-6 space-y-5" onSubmit={props.onSubmit}>
        <PasswordField
          theme="dark"
          label="Current password"
          value={props.currentPassword}
          onChange={(event) => props.onCurrentPasswordChange(event.target.value)}
          placeholder="Enter your current password"
          autoComplete="current-password"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <PasswordField
              theme="dark"
              label="New password"
              value={props.newPassword}
              onChange={(event) => props.onNewPasswordChange(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              hint="Use uppercase, lowercase, a number, and a special character."
            />
            <PasswordStrengthMeter password={props.newPassword} theme="dark" />
          </div>
          <PasswordField
            theme="dark"
            label="Confirm new password"
            value={props.confirmPassword}
            onChange={(event) => props.onConfirmPasswordChange(event.target.value)}
            placeholder="Repeat the new password"
            autoComplete="new-password"
          />
        </div>

        {props.passwordError ? <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{props.passwordError}</p> : null}
        {props.passwordSuccess ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{props.passwordSuccess}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={!props.hasPasswordChanges || props.isChangingPassword}>
            {props.isChangingPassword ? 'Updating password...' : 'Change password'}
          </Button>
          <Button type="button" variant="secondary" disabled={!props.hasPasswordChanges || props.isChangingPassword} onClick={props.onReset}>
            Clear
          </Button>
        </div>
      </form>
    </section>
  );
}

