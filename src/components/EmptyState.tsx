import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Studio-style full-size illustration (e.g. the provided SVG assets). */
  illustration?: string;
  illustrationAlt?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Compact variant — tighter padding, used inside cards. */
  compact?: boolean;
}

export default function EmptyState({
  title,
  description,
  icon,
  illustration,
  illustrationAlt,
  actionLabel,
  onAction,
  compact,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 text-center ${compact ? 'py-10' : 'py-16'}`}
    >
      {illustration ? (
        <img
          src={illustration}
          alt={illustrationAlt ?? ''}
          className={`pointer-events-none select-none object-contain ${compact ? 'mb-3 h-32 w-32' : 'mb-5 h-44 w-44'}`}
          draggable={false}
        />
      ) : icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">{icon}</div>
      ) : null}
      <h3 className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-lg'}`}>{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-body text-gray-500">{description}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="btn-primary mt-6">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}