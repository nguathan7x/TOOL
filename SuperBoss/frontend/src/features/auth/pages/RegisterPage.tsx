import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { AuthFooter } from '../components/AuthFooter';
import { AuthHeader } from '../components/AuthHeader';
import { AuthLayout } from '../components/AuthLayout';
import { Divider } from '../components/Divider';
import { GoogleIdentityButton } from '../components/GoogleIdentityButton';
import { InputField } from '../components/InputField';
import { PasswordField } from '../components/PasswordField';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { SubmitButton } from '../components/SubmitButton';
import { useAuth } from '../hooks/useAuth';
import { validateEmail } from '../utils/validateEmail';

function isStrongPassword(password: string) {
  return /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ fullName?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean }>({});

  const fieldErrors = useMemo(() => {
    const nextErrors: { fullName?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      nextErrors.fullName = 'Enter the full name you use at work.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = 'Enter a valid work email.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    } else if (!isStrongPassword(password)) {
      nextErrors.password = 'Use uppercase, lowercase, a number, and a special character.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords must match.';
    }

    return nextErrors;
  }, [confirmPassword, email, fullName, password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    setError('');

    if (fieldErrors.fullName || fieldErrors.email || fieldErrors.password || fieldErrors.confirmPassword) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password });
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Professional onboarding"
      title="Create your account and enter a cleaner, more structured workspace experience."
      description="Register with your work email to access SuperBoss and collaborate across projects, assignments, approvals, and delivery progress in a polished internal platform."
      badge={
        <div className="rounded-full border border-emerald-200/25 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/85 backdrop-blur">
          Secure team onboarding
        </div>
      }
    >
      <AuthCard>
        <AuthHeader
          label="Create account"
          title="Set up your SuperBoss access"
          description="A refined sign-up flow for teams that need secure onboarding, consistent permissions, and a workspace that already feels production-ready."
          brandSlot={
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#f7faf5] to-[#eef6ef] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#163d2c] shadow-sm">
              SB
            </div>
          }
        />

        <div className="mt-8 space-y-6">
          <GoogleIdentityButton mode="signup" onError={setError} disabled={isSubmitting} />

          <Divider />

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <InputField
              label="Full name"
              placeholder="Nguyen Van A"
              autoComplete="name"
              value={fullName}
              onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
              onChange={(event) => setFullName(event.target.value)}
              error={touched.fullName ? fieldErrors.fullName : undefined}
            />

            <InputField
              label="Work email"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              value={email}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              onChange={(event) => setEmail(event.target.value)}
              error={touched.email ? fieldErrors.email : undefined}
            />

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <PasswordField
                label="Password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                value={password}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                onChange={(event) => setPassword(event.target.value)}
                error={touched.password ? fieldErrors.password : undefined}
                hint="Use 8+ characters with uppercase, lowercase, a number, and a special character."
              />
              <PasswordStrengthMeter password={password} />
            </div>

            <PasswordField
              label="Confirm password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirmPassword}
              onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={touched.confirmPassword ? fieldErrors.confirmPassword : undefined}
            />

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating your account...' : 'Create workspace account'}
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6">
          <AuthFooter
            prompt="Already have an account?"
            action={
              <Link to="/login" className="font-semibold transition hover:text-[#102f22]">
                Sign in
              </Link>
            }
          />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}