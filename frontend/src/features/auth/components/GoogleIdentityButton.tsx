import { useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { SocialAuthButton } from './SocialAuthButton';
import { googleOAuthState } from '../utils/googleOAuthState';

type GoogleIdentityButtonProps = {
  mode: 'signin' | 'signup';
  onError: (message: string) => void;
  disabled?: boolean;
};

export function GoogleIdentityButton({ mode, onError, disabled = false }: GoogleIdentityButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [config, setConfig] = useState<{ clientId: string; redirectUri: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        const response = await authApi.getGoogleConfig();

        if (!isMounted) {
          return;
        }

        if (!response.enabled || !response.clientId || !response.redirectUri) {
          setConfig(null);
          setIsConfigured(false);
          return;
        }

        setConfig({
          clientId: response.clientId,
          redirectUri: response.redirectUri
        });
        setIsConfigured(true);
      } catch (error) {
        if (isMounted) {
          setConfig(null);
          setIsConfigured(false);
          onError(error instanceof Error ? error.message : 'Unable to prepare Google sign-in');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [onError]);

  function handleRedirect() {
    if (!config) {
      onError('Google sign-in is not configured yet.');
      return;
    }

    setIsWorking(true);
    onError('');

    const state = googleOAuthState.create();
    const searchParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: mode === 'signup' ? 'consent' : 'select_account',
      state
    });

    window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${searchParams.toString()}`);
  }

  if (isLoading) {
    return <SocialAuthButton label="Preparing Google..." onClick={() => {}} disabled />;
  }

  if (!isConfigured || !config) {
    return (
      <SocialAuthButton
        label="Google sign-in unavailable"
        onClick={() => onError('Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in backend, then restart the app.')}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="space-y-2">
      <SocialAuthButton
        label={isWorking ? 'Redirecting to Google...' : mode === 'signup' ? 'Continue with Google' : 'Continue with Google'}
        onClick={handleRedirect}
        disabled={disabled || isWorking}
      />
      {isWorking ? <p className="text-center text-xs font-medium text-slate-500">Redirecting to Google secure sign-in...</p> : null}
    </div>
  );
}
