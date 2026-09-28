import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  desc?: string;
  action?: ReactNode;
  className?: string;
}

/** Behance-style section header: 22px title on the left, action on the right. */
export default function SectionHeader({ title, desc, action, className = '' }: SectionHeaderProps): JSX.Element {
  return (
    <div className={`mb-8 flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-h2 font-medium text-gray-900">{title}</h2>
        {desc ? <p className="mt-1 text-meta text-gray-500">{desc}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}