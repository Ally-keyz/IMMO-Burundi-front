import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { AccountSetupDTO } from '@immo/shared-types';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../lib/api';
import AuthSplitShell from '../components/auth/AuthSplitShell';
import PasswordInput from '../components/auth/PasswordInput';

const inputClass =
  'h-10 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500';

export default function SetupAccountPage(): JSX.Element {
  const { token } = useParams<{ token: string }>();
  const { getSetupAccount, activateAccount } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountSetupDTO | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('This account setup link is missing its activation token.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getSetupAccount(token)
      .then((result) => {
        if (!cancelled) setAccount(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [getSetupAccount, token]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Your password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    if (!token) return;
    setSubmitting(true);
    try {
      await activateAccount(token, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitShell>
      <h1 className="text-[20px] font-semibold text-center mb-1 leading-snug text-gray-900">
        Set up your agent account
      </h1>
      <p className="text-center text-[13px] leading-relaxed text-gray-500">
        Create a secure password to activate your IMMO BURUNDI account.
      </p>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden="true" />
          Loading your account…
        </div>
      ) : account ? (
        <form onSubmit={submit} className="mt-5">
          <div className="mb-4 rounded-[8px] bg-gray-50 p-3 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">{account.firstName} {account.lastName}</p>
            <p className="mt-0.5 text-[13px]">{account.email}</p>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="setup-password" className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                New password
              </label>
              <PasswordInput
                id="setup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                placeholder="Create a password (min 8 characters)"
                required
              />
            </div>
            <div>
              <label htmlFor="setup-confirm-password" className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Confirm password
              </label>
              <PasswordInput
                id="setup-confirm-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                placeholder="Repeat your new password"
                required
              />
            </div>
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
            {submitting ? 'Activating…' : 'Activate account'}
          </button>
        </form>
      ) : null}

      {error && !loading && !account ? (
        <div className="mt-5 rounded-md bg-notVerified/10 p-3 text-[13px] text-notVerified" role="alert">
          {error}
        </div>
      ) : null}

      {!loading && !account ? (
        <p className="mt-4 text-center text-[13px] text-gray-500">
          Already activated?{' '}
          <Link to="/login" className="font-semibold text-accent-strong underline decoration-accent-strong underline-offset-2 transition-colors hover:text-gray-900">
            Log in
          </Link>
        </p>
      ) : null}
    </AuthSplitShell>
  );
}
