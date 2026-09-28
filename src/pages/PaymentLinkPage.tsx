import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, CheckCircle2, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import type { CurrencyCode } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { getApiErrorMessage, paymentLinksApi, ApiClientError } from '../lib/api';
import { formatDate } from '../lib/format';
import { formatMsisdn, isValidBurundiMsisdn, providerMeta, MOBILE_MONEY_PROVIDERS, type MobileMoneyProvider } from '../lib/mobileMoney';
import AuthSplitShell from '../components/auth/AuthSplitShell';
import PaymentProvidersPanel from '../components/payment/PaymentProvidersPanel';

type ResolveErrorKind = 'OTHER_USER' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'NOT_FOUND' | null;

/**
 * Every non-form state (login prompt, skeleton, success, link errors) shares the
 * auth shell so the page stays standalone and viewport-height in all of them,
 * exactly like login and signup. Only the pay form swaps in the providers panel.
 */
function Container({ children }: { children: ReactNode }): JSX.Element {
  return (
    <AuthSplitShell wordmark>
      <div className="mx-auto w-full max-w-sm text-center">{children}</div>
    </AuthSplitShell>
  );
}
export default function PaymentLinkPage(): JSX.Element {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { token = '' } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState<Awaited<ReturnType<typeof paymentLinksApi.resolve>> | null>(null);
  const [error, setError] = useState<ResolveErrorKind>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ paymentReference: string; amount: number; currency: string; paidAt: string } | null>(null);

  const [provider, setProvider] = useState<MobileMoneyProvider | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const goTo = (path: string) => navigate(path, { state: { from: `/pay/${token}` } });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorMsg('');
    try {
      const data = await paymentLinksApi.resolve(token);
      setResolved(data);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
      if (err instanceof ApiClientError) {
        if (err.code === 'PAYMENT_LINK_FOR_OTHER_USER') setError('OTHER_USER');
        else if (err.code === 'LINK_EXPIRED') setError('EXPIRED');
        else if (err.code === 'LINK_CANCELLED') setError('CANCELLED');
        else if (err.code === 'LINK_ALREADY_PAID') setError('PAID');
        else setError('NOT_FOUND');
      } else {
        setError('NOT_FOUND');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const phoneValid = isValidBurundiMsisdn(phone);
  const selected = providerMeta(provider);
  const canPay = Boolean(provider) && phoneValid && !paying;

  const confirmPayment = async () => {
    if (!provider) {
      setFormError(t('pay.pickProvider'));
      return;
    }
    if (!phoneValid) {
      setPhoneTouched(true);
      setFormError(t('pay.invalidNumber'));
      return;
    }
    setFormError(null);
    setPaying(true);
    try {
      const res = await paymentLinksApi.pay(token, { provider, payerPhone: phone });
      setSuccess(res);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err));
      if (err instanceof ApiClientError && err.code === 'LINK_ALREADY_PAID') setError('PAID');
      else if (err instanceof ApiClientError && err.code === 'PAYMENT_LINK_FOR_OTHER_USER') setError('OTHER_USER');
      else if (err instanceof ApiClientError && err.code === 'LINK_EXPIRED') setError('EXPIRED');
      else if (err instanceof ApiClientError && err.code === 'REJECTION_REASON_REQUIRED') setError('NOT_FOUND');
      else setFormError(getApiErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100" />
        <div className="mt-4 h-6 w-1/2 animate-pulse rounded-lg bg-gray-100" />
      </Container>
    );
  }

  if (success) {
    return (
      <Container>
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-verified/10 text-verified">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="page-title mt-5">{t('pay.success')}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{t('pay.successDesc', { reference: success.paymentReference })}</p>
        <p className="mt-6 text-3xl font-bold text-gray-900">{formatPrice(success.amount, success.currency as CurrencyCode)}</p>
        <p className="mt-1 text-xs text-gray-400">{t('pay.paidOn', { date: formatDate(success.paidAt) ?? '' })}</p>
        {providerMeta(provider) ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-[13px] font-medium text-gray-700">
            <span
              className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold"
              style={{ backgroundColor: providerMeta(provider)!.color, color: providerMeta(provider)!.onColor }}
              aria-hidden="true"
            >
              {providerMeta(provider)!.monogram}
            </span>
            {formatMsisdn(phone)} · {providerMeta(provider)!.wallet}
          </p>
        ) : null}
        <button type="button" onClick={() => navigate('/')} className="btn-primary mt-8 rounded-full">
          {t('pay.backToHome')}
        </button>
      </Container>
    );
  }

  if (error === 'OTHER_USER') {
    return (
      <Container>
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-notVerified/10 text-notVerified">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="page-title mt-5">{t('pay.notForYou')}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{t('pay.notForYouDesc')}</p>
        <div className="mt-6 grid w-full grid-cols-1 gap-2">
          <button type="button" onClick={() => goTo('/login')} className="btn-primary rounded-full">
            {t('pay.changeAccount')}
          </button>
        </div>
      </Container>
    );
  }

  if (error === 'PAID') {
    return (
      <Container>
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-verified/10 text-verified">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="page-title mt-5">{t('pay.alreadyPaid')}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{t('pay.alreadyPaidDesc')}</p>
        <button type="button" onClick={() => navigate('/')} className="btn-primary mt-8 rounded-full">
          {t('pay.backToHome')}
        </button>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <ShieldCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="page-title mt-5">{t('pay.linkInvalid')}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{errorMsg || t('pay.linkInvalidDesc')}</p>
        <button type="button" onClick={() => navigate('/')} className="btn-primary mt-8 rounded-full">
          {t('pay.backToHome')}
        </button>
      </Container>
    );
  }

  if (!resolved) return <Container><p className="text-sm text-gray-500">{t('common.loading')}</p></Container>;

  const amount = Number(resolved.amount);

  return (
    <AuthSplitShell
      wordmark
      panel={
        <PaymentProvidersPanel selected={provider} onSelect={setProvider} disabled={paying} />
      }
    >
      <div className="mx-auto w-full max-w-sm">
        <div className="mt-3 rounded-xl bg-gray-50 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t('pay.amountLabel')}</p>
          <p className="mt-0.5 text-2xl font-bold text-gray-900">{formatPrice(amount, resolved.currency as CurrencyCode)}</p>
          {resolved.payee ? (
            <p className="mt-1 text-[13px] text-gray-500">
              {t('pay.to')}{' '}
              <span className="font-semibold text-gray-900">
                {resolved.payee.firstName} {resolved.payee.lastName}
              </span>
            </p>
          ) : null}
        </div>

        {resolved.property ? (
          <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-gray-200 p-2.5">
            {resolved.property.thumbnail ? (
              <img src={resolved.property.thumbnail} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-gray-900">{resolved.property.title}</p>
              <p className="text-xs text-gray-500">
                {resolved.property.propertyId} · {resolved.property.listingType}
              </p>
            </div>
          </div>
        ) : null}

        {resolved.note ? <p className="mt-2.5 text-[13px] text-gray-500">{resolved.note}</p> : null}

        <form
          className="mt-4 space-y-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            void confirmPayment();
          }}
        >
          <div>
            <label className="label" htmlFor="pay-provider">
              {t('pay.providerLabel')} *
            </label>
            <select
              id="pay-provider"
              required
              value={provider ?? ''}
              onChange={(event) => setProvider((event.target.value || null) as MobileMoneyProvider | null)}
              className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none transition-colors focus:border-brand-500"
            >
              <option value="">{t('pay.pickProvider')}</option>
              {MOBILE_MONEY_PROVIDERS.map((id) => {
                const meta = providerMeta(id)!;
                return (
                  <option key={id} value={id}>
                    {meta.wallet} — {meta.operator}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="pay-phone">
              {t('pay.phoneLabel')} *
            </label>
            <div
              className={`mt-1 flex h-11 items-center overflow-hidden rounded-xl border bg-surface transition-colors ${
                phoneTouched && !phoneValid ? 'border-notVerified' : 'border-gray-200 focus-within:border-brand-500'
              }`}
            >
              <span className="flex h-full items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 text-body font-semibold text-gray-700">
                <span aria-hidden="true">🇧🇮</span>+257
              </span>
              <input
                id="pay-phone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="79 11 10 01"
                value={phone}
                onChange={(event) => {
                  setPhone(formatMsisdn(event.target.value));
                  setFormError(null);
                }}
                onBlur={() => setPhoneTouched(true)}
                aria-invalid={phoneTouched && !phoneValid}
                className="h-full w-full min-w-0 bg-transparent px-3.5 text-body text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
            {phoneTouched && !phoneValid ? (
              <p className="mt-1 text-xs font-medium text-notVerified">{t('pay.invalidNumber')}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">{t('pay.phoneHint')}</p>
            )}
          </div>

          {formError ? (
            <p role="alert" className="rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">
              {formError}
            </p>
          ) : null}

          {selected ? (
            <p className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-[13px] text-gray-600">
              <Smartphone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              {t('pay.confirmPrompt')} <span className="font-semibold text-gray-900">{selected.wallet}</span> ·{' '}
              {selected.ussd}
            </p>
          ) : null}

          <button type="submit" disabled={!canPay} className="btn-primary h-11 w-full rounded-full">
            {paying ? t('pay.processing') : `${t('pay.confirm')} ${formatPrice(amount, resolved.currency as CurrencyCode)}`}
          </button>
        </form>
      </div>
    </AuthSplitShell>
  );
}
