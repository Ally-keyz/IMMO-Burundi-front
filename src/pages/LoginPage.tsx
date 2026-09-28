import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../lib/api';
import { isMainAdminRole } from '../lib/roles';
import AuthSplitShell from '../components/auth/AuthSplitShell';
import GoogleAuthButton, { OrDivider } from '../components/auth/GoogleAuthButton';
import PasswordInput from '../components/auth/PasswordInput';

export default function LoginPage(): JSX.Element {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ identifier: identifier.trim(), password });
      void remember;
      navigate(isMainAdminRole(user.role) ? '/dashboard' : '/', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitShell>
      <h1 className="text-[20px] font-semibold text-center mb-1 leading-snug text-gray-900">
        Find your dream home in Burundi
      </h1>
  

      <GoogleAuthButton
        label="Log in with Google"
        onError={setError}
        onSuccess={async (accessToken) => {
          setError(null);
          try {
            const user = await googleLogin(accessToken);
            void remember;
            navigate(isMainAdminRole(user.role) ? '/dashboard' : '/', { replace: true });
          } catch (err) {
            setError(getApiErrorMessage(err));
          }
        }}
      />
      <OrDivider />

      <form onSubmit={submit}>
        <div className="space-y-3">
          <div>
            <label htmlFor="login-identifier" className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Phone or email
            </label>
            <input
              id="login-identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+257 12 34 56 78 or your@email.com"
              className="h-10 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Password
            </label>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <input
            id="login-remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <label htmlFor="login-remember" className="text-[13px] text-gray-500">
            Remember me
          </label>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-md bg-notVerified/10 p-3 text-[13px] text-notVerified">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-950 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Log in
        </button>
      </form>

      <p className="mt-4 text-center text-[13px] text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-accent-strong underline decoration-accent-strong underline-offset-2 transition-colors hover:text-gray-900">
          Sign up
        </Link>
      </p>
    </AuthSplitShell>
  );
}