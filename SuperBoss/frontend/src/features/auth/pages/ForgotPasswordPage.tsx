import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { AuthFooter } from '../components/AuthFooter';
import { AuthHeader } from '../components/AuthHeader';
import { AuthLayout } from '../components/AuthLayout';
import { Divider } from '../components/Divider';
import { InputField } from '../components/InputField';
import { LogoMark } from '../components/LogoMark';
import { SocialAuthButton } from '../components/SocialAuthButton';
import { SubmitButton } from '../components/SubmitButton';
import { validateEmail } from '../utils/validateEmail';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailError = useMemo(() => {
    if (!email.trim()) {
      return 'Email is required.';
    }

    if (!validateEmail(email.trim())) {
      return 'Enter a valid work email.';
    }

    return '';
  }, [email]);

  function handleGoogleLogin() {
    setGoogleLoading(true);
    setError('');
    setMessage('');

    window.setTimeout(() => {
      setGoogleLoading(false);
      setMessage(
        'Google recovery placeholder is ready. You can connect account lookup or OAuth-based recovery here later.'
      );
    }, 500);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setError('');
    setMessage('');

    if (emailError) {
      return;
    }

    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setMessage(
        `Password recovery placeholder sent for ${email.trim()}. Connect this screen to your reset-email API later.`
      );
    }, 700);
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Recover access with a clean, professional flow that matches the rest of the auth experience."
      description="Use your work email to continue the recovery process and keep the password reset journey polished while the backend reset flow is being connected."
      badge={
        <div className="rounded-full border border-emerald-200/25 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/85 backdrop-blur">
          Secure recovery flow
        </div>
      }
    >
      <AuthCard>
        <AuthHeader
          label="Forgot password"
          title="Recover your SuperBoss account"
          description="This placeholder keeps the recovery experience complete and production-like while reset email delivery and token verification are still being finalized."
          brandSlot={
            <LogoMark
              compact
              className="border-emerald-100 bg-gradient-to-br from-[#f7faf5] to-[#eef6ef] text-[#163d2c] shadow-sm [&_p]:text-[#163d2c]/75"
            />
          }
        />

        <div className="mt-8 space-y-6">
          <div
            className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-sm leading-6 text-slate-600 auth-fade-up"
            style={{ ['--delay' as string]: '220ms' }}
          >
            Enter the email address linked to your workspace account. This screen is currently a
            placeholder for reset-email delivery, but the interaction is designed to feel complete
            and consistent with the rest of the authentication flow.
          </div>

          <SocialAuthButton
            label={googleLoading ? 'Preparing Google recovery...' : 'Continue with Google'}
            onClick={handleGoogleLogin}
            disabled={googleLoading || isSubmitting}
          />

          <Divider label="or recover with email" />

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <InputField
              label="Work email"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              value={email}
              onBlur={() => setTouched(true)}
              onChange={(event) => setEmail(event.target.value)}
              error={touched ? emailError || undefined : undefined}
            />

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            <SubmitButton type="submit" disabled={isSubmitting || googleLoading}>
              {isSubmitting ? 'Preparing recovery...' : 'Send recovery link'}
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6">
          <AuthFooter
            prompt="Remembered your password?"
            action={
              <Link to="/login" className="font-semibold transition hover:text-[#102f22]">
                Back to sign in
              </Link>
            }
          />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}