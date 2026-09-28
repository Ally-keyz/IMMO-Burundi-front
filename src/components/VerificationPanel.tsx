import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, MinusCircle, ShieldCheck, XCircle } from 'lucide-react';
import type { VerificationStatus } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate } from '../lib/format';

type CheckOutcome = 'PASSED' | 'FAILED' | 'PARTIAL' | 'NOT_APPLICABLE' | 'PENDING';

interface DocumentCheckRow {
  labelKey: string;
  status: CheckOutcome;
}

interface VerificationPanelProps {
  status: VerificationStatus;
  disclaimer?: string;
  code?: string;
  verifiedAt?: string;
  checks?: Array<{ labelKey?: string; label?: string; status: CheckOutcome }>;
}

function synthesizeChecks(status: VerificationStatus): DocumentCheckRow[] {
  switch (status) {
    case 'FULLY_VERIFIED':
      return [
        { labelKey: 'verification.landTitle', status: 'PASSED' },
        { labelKey: 'verification.saleAgreement', status: 'PASSED' },
        { labelKey: 'verification.top', status: 'PASSED' },
        { labelKey: 'verification.propertyTax', status: 'PASSED' },
        { labelKey: 'verification.ownerId', status: 'PASSED' },
      ];
    case 'VERIFIED':
      return [
        { labelKey: 'verification.landTitle', status: 'PASSED' },
        { labelKey: 'verification.ownerId', status: 'PASSED' },
        { labelKey: 'verification.propertyTax', status: 'PASSED' },
        { labelKey: 'verification.saleAgreement', status: 'PARTIAL' },
      ];
    case 'PARTIAL':
      return [
        { labelKey: 'verification.landTitle', status: 'PASSED' },
        { labelKey: 'verification.ownerId', status: 'PARTIAL' },
        { labelKey: 'verification.propertyTax', status: 'PENDING' },
        { labelKey: 'verification.saleAgreement', status: 'PENDING' },
      ];
    default:
      return [
        { labelKey: 'verification.landTitle', status: 'PENDING' },
        { labelKey: 'verification.ownerId', status: 'PENDING' },
        { labelKey: 'verification.propertyTax', status: 'PENDING' },
        { labelKey: 'verification.saleAgreement', status: 'PENDING' },
      ];
  }
}

const OUTCOME_META: Record<CheckOutcome, { icon: JSX.Element; className: string; labelKey: string }> = {
  PASSED: {
    icon: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />,
    className: 'text-verified',
    labelKey: 'verification.passed',
  },
  FAILED: {
    icon: <XCircle className="h-5 w-5" aria-hidden="true" />,
    className: 'text-notVerified',
    labelKey: 'verification.failed',
  },
  PARTIAL: {
    icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
    className: 'text-partial',
    labelKey: 'verification.partial',
  },
  NOT_APPLICABLE: {
    icon: <MinusCircle className="h-5 w-5" aria-hidden="true" />,
    className: 'text-gray-400',
    labelKey: 'verification.notApplicable',
  },
  PENDING: {
    icon: <MinusCircle className="h-5 w-5" aria-hidden="true" />,
    className: 'text-gray-400',
    labelKey: 'verification.notApplicable',
  },
};

export default function VerificationPanel({
  status,
  disclaimer,
  code,
  verifiedAt,
  checks,
}: VerificationPanelProps): JSX.Element {
  const { t } = useLanguage();
  const rows: Array<{ labelKey?: string; label?: string; status: CheckOutcome }> =
    checks && checks.length > 0 ? checks : synthesizeChecks(status);

  return (
    <section className="card p-6" aria-label={t('verification.title')}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">{t('verification.title')}</h2>
          {code ? <p className="text-xs text-gray-400">REF · {code}</p> : null}
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {rows.map((row, i) => {
          const meta =
            row.status === 'PENDING'
              ? OUTCOME_META.NOT_APPLICABLE
              : OUTCOME_META[row.status] ?? OUTCOME_META.NOT_APPLICABLE;
          return (
            <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
              <span className="flex items-center gap-3">
                <span className={meta.className}>{meta.icon}</span>
                <span className="text-sm font-medium text-gray-800">{row.labelKey ? t(row.labelKey) : row.label}</span>
              </span>
              <span className={`text-xs font-semibold ${meta.className}`}>{t(meta.labelKey)}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>{disclaimer ?? t('property.disclaimer')}</p>
      </div>

      {verifiedAt ? (
        <p className="mt-3 text-xs text-gray-400">
          {t('verification.verifiedAt')}: {formatDate(verifiedAt)}
        </p>
      ) : null}

      <Link to="/verification-disclaimer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        {t('verification.learnMore')} →
      </Link>
    </section>
  );
}