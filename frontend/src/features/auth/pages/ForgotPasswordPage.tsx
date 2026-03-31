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
      setMessage('Google recovery placeholder is ready. You can wire account recovery or OAuth account lookup here later.');
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
      setMessage(`Password recovery placeholder sent for ${email.trim()}. Connect this screen to your reset-email API later.`);
    }, 700);
  }

  return (
    <AuthLayout
      eyebrow="Recovery flow"
      title="Recover access without breaking the premium auth experience."
      description="Use this placeholder screen to validate the reset-password UX today, then plug in email delivery and token-based recovery when the backend flow is ready."
      badge={<div className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/85">Future reset flow</div>}
    >
      <AuthCard>
        <AuthHeader
          label="Forgot password"
          title="Regain access to your workspace"
          description="This is a product-quality placeholder for the recovery flow. It keeps the auth system feeling complete while the reset API is still pending."
          brandSlot={<LogoMark compact className="border-[#dbe6d8] bg-[#f7faf5] text-[#163d2c] [&_p]:text-[#163d2c]/75" />}
        />

        <div className="mt-8 space-y-5">
          <div className="rounded-[1.6rem] border border-[#dbe6d8] bg-[#f6faf4] p-4 text-sm text-slate-600 auth-fade-up" style={{ ['--delay' as string]: '220ms' }}>
            Enter the email tied to your account and we will reserve this flow for reset-email delivery later. The interaction is intentionally placeholder-only for now.
          </div>

          <SocialAuthButton
            label={googleLoading ? 'Preparing Google recovery...' : 'Continue with Google'}
            onClick={handleGoogleLogin}
            disabled={googleLoading || isSubmitting}
          />

          <Divider label="or request recovery" />

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <InputField
              label="Work email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onBlur={() => setTouched(true)}
              onChange={(event) => setEmail(event.target.value)}
              error={touched ? emailError || undefined : undefined}
            />

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
            ) : null}

            <SubmitButton type="submit" disabled={isSubmitting || googleLoading}>
              {isSubmitting ? 'Preparing recovery...' : 'Send recovery placeholder'}
            </SubmitButton>
          </form>
        </div>

        <div className="mt-6">
          <AuthFooter
            prompt="Remembered your password?"
            action={<Link to="/login" className="transition hover:text-[#102f22]">Back to sign in</Link>}
          />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

