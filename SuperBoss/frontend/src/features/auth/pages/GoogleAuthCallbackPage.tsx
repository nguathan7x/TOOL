import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { AuthHeader } from '../components/AuthHeader';
import { AuthLayout } from '../components/AuthLayout';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../hooks/useAuth';
import { googleOAuthState } from '../utils/googleOAuthState';

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
      title="Completing secure sign-in"
      description="We are validating your Google authorization and creating a SuperBoss session."
      badge={<div className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/85">OAuth callback</div>}
    >
      <AuthCard>
        <AuthHeader
          label="Google sign-in"
          title={error ? 'Google sign-in could not be completed' : 'Finishing your session'}
          description={error || 'Please wait while we exchange your Google authorization code and restore your workspace access.'}
          brandSlot={<LogoMark compact className="border-[#dbe6d8] bg-[#f7faf5] text-[#163d2c] [&_p]:text-[#163d2c]/75" />}
        />
        {!error ? <div className="mt-8 rounded-2xl border border-[#dbe6d8] bg-[#f7faf5] px-4 py-4 text-sm text-slate-600">Authorizing with Google and preparing your SuperBoss session...</div> : null}
      </AuthCard>
    </AuthLayout>
  );
}
