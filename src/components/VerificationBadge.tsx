import type { VerificationStatus } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_META: Record<
  VerificationStatus,
  { dot: string; labelKey: string; badgeClass: string }
> = {
  NOT_VERIFIED: { dot: 'bg-notVerified', labelKey: 'property.notVerified', badgeClass: 'bg-notVerified/10 text-notVerified' },
  PARTIAL: { dot: 'bg-partial', labelKey: 'property.partial', badgeClass: 'bg-partial/10 text-yellow-700' },
  VERIFIED: { dot: 'bg-verified', labelKey: 'property.verified', badgeClass: 'bg-verified/10 text-verified' },
  FULLY_VERIFIED: { dot: 'bg-verified', labelKey: 'property.fullyVerified', badgeClass: 'bg-verified/10 text-verified' },
  EXPIRED: { dot: 'bg-gray-400', labelKey: 'property.notVerified', badgeClass: 'bg-gray-100 text-gray-500' },
  SUSPENDED: { dot: 'bg-gray-400', labelKey: 'property.notVerified', badgeClass: 'bg-gray-100 text-gray-500' },
};

interface VerificationBadgeProps {
  status: VerificationStatus;
  showIcon?: boolean;
  className?: string;
}

/** Verification status: coloured dot + text label, never colour alone (§78). */
export default function VerificationBadge({ status, showIcon = true, className = '' }: VerificationBadgeProps): JSX.Element {
  const { t } = useLanguage();
  const meta = STATUS_META[status] ?? STATUS_META.NOT_VERIFIED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeClass} ${className}`}
    >
      {showIcon ? <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" /> : null}
      <span>{t(meta.labelKey)}</span>
    </span>
  );
}