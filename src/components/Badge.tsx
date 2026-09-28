import type { ReactNode } from 'react';

export type BadgeVariant = 'verified' | 'partial' | 'not-verified' | 'featured' | 'new' | 'for-sale' | 'for-rent' | 'neutral';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  verified: 'bg-verified/10 text-verified',
  partial: 'bg-partial/10 text-partial',
  'not-verified': 'bg-notVerified/10 text-notVerified',
  featured: 'bg-accent text-ink',
  new: 'bg-ink text-white',
  'for-sale': 'bg-teal-600 text-white',
  'for-rent': 'bg-orange-500 text-white',
  neutral: 'bg-gray-100 text-gray-600',
};

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * Reusable badge. A text label is ALWAYS required —
 * colour alone is never used to convey meaning (§78 a11y).
 */
export default function Badge({ variant, label, icon, className = '' }: BadgeProps): JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${VARIANT_STYLES[variant]} ${className}`}
    >
      {icon ?? null}
      <span>{label}</span>
    </span>
  );
}