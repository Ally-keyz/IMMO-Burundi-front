import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AgentSummary } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';

function initials(a: AgentSummary): string {
  return `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase() || 'A';
}

/** Directory card for a single agent on the Agents page. */
export default function AgentCard({ agent }: { agent: AgentSummary }): JSX.Element {
  const { t } = useLanguage();
  const rating = agent.rating ?? 0;
  const listings = agent.totalProperties ?? 0;

  return (
    <Link
      to={`/agent/${agent.id}`}
      className="flex h-full flex-col rounded-2xl border border-gray-200 bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop"
    >
      <div className="flex items-start justify-between">
        {agent.photoUrl ? (
          <img
            src={agent.photoUrl}
            alt={`${agent.firstName} ${agent.lastName}`}
            loading="lazy"
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-lg font-bold text-white">
            {initials(agent)}
          </span>
        )}
        {agent.topAgent ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            {t('agents.top')}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-bold text-gray-900">
        {agent.firstName} {agent.lastName}
      </h3>
      {agent.agencyName ? (
        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-brand-700">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          {agent.agencyName}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
        {agent.province?.name ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {agent.province.name}
          </span>
        ) : null}
        {rating > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
            <Star className="h-4 w-4 text-accent-strong" aria-hidden="true" />
            {rating.toFixed(1)}
          </span>
        ) : null}
      </div>

      <p className="mt-auto pt-4 text-sm text-gray-500">
        {listings} {t('agents.listings')}
      </p>
    </Link>
  );
}