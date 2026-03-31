import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { AuthHeader } from '../components/AuthHeader';
import { AuthLayout } from '../components/AuthLayout';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../hooks/useAuth';
import { googleOAuthState } from '../utils/googleOAuthState';
//Dang nhap HuongSen
export function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function finishGoogleLogin() {
      const oauthError = searchParams.get('error');
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (oauthError) {
        if (isMounted) {
          setError('Google sign-in was cancelled or denied.');
        }
        return;
      }

      if (!googleOAuthState.consume(state)) {
        if (isMounted) {
          setError('Google sign-in state could not be verified. Please try again.');
        }
        return;
      }

      if (!code) {
        if (isMounted) {
          setError('Google did not return an authorization code.');
        }
        return;
      }

      try {
        await loginWithGoogle(code);
        navigate('/dashboard', { replace: true });
      } catch (callbackError) {
        if (isMounted) {
          setError(callbackError instanceof Error ? callbackError.message : 'Unable to complete Google sign-in.');
        }
      }
    }

    finishGoogleLogin();

    return () => {
      isMounted = false;
    };
  }, [loginWithGoogle, navigate, searchParams]);

  return (
    <AuthLayout
      eyebrow="Google OAuth"
      title="Completing your secure workspace sign-in."
      description="We are verifying your Google authorization and preparing your SuperBoss session."
      badge={
        <div className="rounded-full border border-emerald-200/25 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/85 backdrop-blur">
          Secure OAuth callback
        </div>
      }
    >
      <AuthCard>
        <AuthHeader
          label="Google sign-in"
          title={error ? 'Google sign-in could not be completed' : 'Finishing your session'}
          description={
            error ||
            'Please wait while we exchange your Google authorization code and restore access to your workspace.'
          }
          brandSlot={
            <LogoMark
              compact
              className="border-emerald-100 bg-gradient-to-br from-[#f7faf5] to-[#eef6ef] text-[#163d2c] shadow-sm [&_p]:text-[#163d2c]/75"
            />
          }
        />

        {!error ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-5 text-sm leading-6 text-slate-600">
              Authorizing with Google and preparing your SuperBoss session. This should only take a
              moment.
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
              Secure authentication is in progress...
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
}