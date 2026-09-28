import { useEffect, useState } from 'react';
import { Building2, Check, Copy, Link2, Send } from 'lucide-react';
import type { PaymentLinkSummary } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { paymentLinksApi, getApiErrorMessage } from '../../lib/api';
import Modal from '../../components/Modal';

export interface PaymentLinkTarget {
  requesterUserId: string;
  requesterName: string;
  propertyId: string;
  propertyTitle: string;
  defaultAmount?: number;
  defaultCurrency?: string;
  enquiryId?: string;
  bookingId?: string;
}

interface PaymentLinkModalProps {
  open: boolean;
  onClose: () => void;
  target: PaymentLinkTarget | null;
  onLinkCreated?: (link: PaymentLinkSummary) => void;
}

export default function PaymentLinkModal({ open, onClose, target, onLinkCreated }: PaymentLinkModalProps): JSX.Element {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BIF');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<PaymentLinkSummary | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setError(null);
    setCopied(false);
    setAmount(target?.defaultAmount ? String(target.defaultAmount) : '');
    setCurrency(target?.defaultCurrency ?? 'BIF');
  }, [open, target]);

  const fullUrl = `${window.location.origin}/pay/${created?.token ?? ''}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!target) return;
    setError(null);
    setSubmitting(true);
    try {
      const link = await paymentLinksApi.create({
        propertyId: target.propertyId,
        requesterUserId: target.requesterUserId,
        amount: Number(amount),
        currency,
        enquiryId: target.enquiryId,
        bookingId: target.bookingId,
      });
      setCreated(link);
      onLinkCreated?.(link);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('dashboard.sendLink')}>
      {created ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-verified/20 bg-verified/5 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verified text-white">
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{t('dashboard.linkSent')}</p>
              <p className="truncate text-xs text-gray-500">{fullUrl}</p>
            </div>
          </div>
          <button type="button" onClick={() => void copy()} className="btn-outline w-full">
            <Copy className="h-4 w-4" aria-hidden="true" />
            {copied ? t('dashboard.linkCopied') : t('dashboard.copyLink')}
          </button>
          <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
            <span className="text-gray-500">{t('plink.status.SENT')}</span>
            <span className="font-semibold text-gray-900">
              {Number(created.amount).toLocaleString()} {created.currency}
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{target?.propertyTitle}</p>
              <p className="text-xs text-gray-500">{t('pay.to')} {target?.requesterName}</p>
            </div>
          </div>

          <div>
            <label htmlFor="pl-amount" className="label">{t('pay.amountLabel')} *</label>
            <div className="mt-1 flex gap-2">
              <input
                id="pl-amount"
                required
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-surface px-3.5 text-body text-gray-900 outline-none focus:border-brand-500"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-10 w-24 shrink-0 rounded-lg border border-gray-200 bg-surface px-2 text-body text-gray-900 outline-none focus:border-brand-500"
              >
                <option value="BIF">BIF</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">{error}</p>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="btn-outline">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              <Send className="h-4 w-4" aria-hidden="true" />
              {submitting ? t('common.loading') : t('dashboard.sendLink')}
            </button>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t('list.needHelp')}
          </p>
        </form>
      )}
    </Modal>
  );
}