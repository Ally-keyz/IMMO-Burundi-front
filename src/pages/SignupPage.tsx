import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getApiErrorMessage } from '../lib/api';
import AuthSplitShell from '../components/auth/AuthSplitShell';
import GoogleAuthButton, { OrDivider } from '../components/auth/GoogleAuthButton';
import PasswordInput from '../components/auth/PasswordInput';

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

const inputClass =
  'h-10 w-full rounded-[8px] border border-gray-200 bg-surface px-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500';

export default function SignupPage(): JSX.Element {
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = () => {
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    setStep(2);
  };

  const back = () => {
    setError(null);
    setStep(1);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { firstName, lastName } = splitName(fullName);
      await register({
        firstName,
        lastName,
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        role: 'CUSTOMER',
        preferredLanguage: language,
        preferredCurrency: currency,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const stepBar = (n: number) =>
    `h-1 flex-1 rounded-full ${step >= n ? 'bg-brand-500' : 'bg-gray-200'}`;

  return (
    <AuthSplitShell>
      <h1 className="text-[20px] font-semibold text-center mb-1 leading-snug text-gray-900">
        Create your account
      </h1>

      <div className="mt-4">
        <GoogleAuthButton
          label="Sign up with Google"
          onError={setError}
          onSuccess={async (accessToken) => {
            setError(null);
            try {
              await googleLogin(accessToken);
              navigate('/', { replace: true });
            } catch (err) {
              setError(getApiErrorMessage(err));
            }
          }}
        />
        <OrDivider />
      </div>

      <form onSubmit={submit}>
        <div className="mb-3 flex items-center gap-1.5" aria-label={`Step ${step} of 2`}>
          <span className={stepBar(1)} />
          <span className={stepBar(2)} />
          <span className="ml-1.5 text-xs font-medium text-gray-400">Step {step} of 2</span>
        </div>

        <div className="space-y-3">
          {step === 1 ? (
            <>
              <div>
                <label htmlFor="signup-name" className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputClass}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="signup-phone" className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phone
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+257 12 34 56 78"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Password
                </label>
                <PasswordInput
                  id="signup-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Create a password (min 8 characters)"
                  required
                />
              </div>
            </>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-md bg-notVerified/10 p-3 text-[13px] text-notVerified">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <button
            type="button"
            onClick={next}
            className="mt-4 flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-950 active:scale-[0.99]"
          >
            Continue
          </button>
        ) : (
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-950 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={back}
              className="mt-3 w-full text-center text-[13px] font-medium text-gray-500 transition-colors hover:text-gray-700"
            >
              ← Back
            </button>
          </div>
        )}
      </form>

      <p className="mt-3 text-center text-[13px] text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent-strong underline decoration-accent-strong underline-offset-2 transition-colors hover:text-gray-900">
          Log in
        </Link>
      </p>
    </AuthSplitShell>
  );
}