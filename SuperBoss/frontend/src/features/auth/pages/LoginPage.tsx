import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { AuthFooter } from '../components/AuthFooter';
import { AuthHeader } from '../components/AuthHeader';
import { AuthLayout } from '../components/AuthLayout';
import { Divider } from '../components/Divider';
import { GoogleIdentityButton } from '../components/GoogleIdentityButton';
import { InputField } from '../components/InputField';
import { LogoMark } from '../components/LogoMark';
import { PasswordField } from '../components/PasswordField';
import { SubmitButton } from '../components/SubmitButton';
import { useAuth } from '../hooks/useAuth';
import { validateEmail } from '../utils/validateEmail';
//DangNhap
export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const fieldErrors = useMemo(() => {
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = 'Enter a valid work email.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    return nextErrors;
  }, [email, password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setError('');

    if (fieldErrors.email || fieldErrors.password) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password }, { remember: rememberMe });
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Secure access"
      title="Sign in to manage projects, people, and delivery flow with confidence."
      description="Enter SuperBoss using your work account to track execution, monitor progress, and collaborate across workspace operations in one professional environment."
      badge={
        <div className="rounded-full border border-emerald-200/25 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/85 backdrop-blur">
          Enterprise workspace access
        </div>
      }
    >
      <AuthCard>
        <AuthHeader
          label="Welcome back"
          title="Sign in to SuperBoss"
          description="A cleaner experience for delivery teams who need visibility, accountability, and a workspace that feels polished from the first screen."
          brandSlot={
            <LogoMark
              compact
              className="border-emerald-100 bg-gradient-to-br from-[#f7faf5] to-[#eef6ef] text-[#163d2c] shadow-sm [&_p]:text-[#163d2c]/75"
            />
          }
        />

        <div className="mt-8 space-y-6">
          <GoogleIdentityButton mode="signin" onError={setError} disabled={isSubmitting} />

          <Divider />

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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

            <PasswordField
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onBlur={() => setTouched((current) => ({ ...current, password: true }))}
              onChange={(event) => setPassword(event.target.value)}
              error={touched.password ? fieldErrors.password : undefined}
              hint="Use the seeded demo password if you are signing in to a sample account."
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#c8d8c7] text-[#163d2c] focus:ring-[#cfe5cf]"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  Keep me signed in
                </label>

                <Link
                  to="/forgot-password"
                  className="text-left font-semibold text-[#163d2c] transition hover:text-[#102f22] sm:text-right"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing you in...' : 'Sign in to workspace'}
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6">
          <AuthFooter
            prompt="New to SuperBoss?"
            action={
              <Link to="/register" className="font-semibold transition hover:text-[#102f22]">
                Create an account
              </Link>
            }
          />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}