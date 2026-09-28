import { useCallback, useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID: string =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ??
  '1038556266063-naaeung21596m9c3uha3bg8grccd2tfl.apps.googleusercontent.com';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (listener?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          cancel: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            ux_mode?: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No window'));
      return;
    }
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface GoogleAuthButtonProps {
  label: string;
  role?: 'CLIENT' | 'CUSTOMER' | 'AGENT';
  onSuccess: (accessToken: string) => Promise<void> | void;
  onError?: (message: string) => void;
}

function GoogleG(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function GoogleAuthButton({ label, role, onSuccess, onError }: GoogleAuthButtonProps): JSX.Element {
  const [busy, setBusy] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  /* Stable callback — reads the latest handlers through refs. */
  const handleTokenResponse = useCallback(
    (response: { access_token?: string; error?: string; error_description?: string }): void => {
      if (response.error) {
        onErrorRef.current?.(response.error_description || `Google sign-in failed (${response.error}).`);
        return;
      }
      const token = response.access_token;
      if (!token) {
        onErrorRef.current?.('Google sign-in did not return a token.');
        return;
      }
      setBusy(true);
      Promise.resolve(onSuccessRef.current(token))
        .catch((err: unknown) => onErrorRef.current?.(err instanceof Error ? err.message : 'Google sign-in failed.'))
        .finally(() => setBusy(false));
    },
    [],
  );

  useEffect(() => {
    void loadGisScript().catch(() => undefined);
  }, []);

  const onClick = async () => {
    if (busy) return;
    try {
      await loadGisScript();
      const tokenClient = window.google?.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: handleTokenResponse,
      });
      tokenClient?.requestAccessToken();
    } catch {
      onErrorRef.current?.('Could not load Google sign-in. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-gray-200 bg-surface text-sm font-semibold text-gray-700 outline-none transition-colors hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleG />
      {busy ? 'Sending information…' : label}
    </button>
  );
}

export function OrDivider(): JSX.Element {
  return (
    <div className="my-3 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="text-xs text-gray-400">or</span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}