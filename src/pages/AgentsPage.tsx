import { useState } from 'react';
import { Search, Users, X } from 'lucide-react';
import { agentsApi } from '../lib/api';
import { Seo, withGlobalJsonLd } from '../components/seo/Seo';
import { useAsyncData } from '../lib/useAsyncData';
import { useLanguage } from '../contexts/LanguageContext';
import AgentCard from '../components/AgentCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { CategoryHero } from '../components/explore/CategoryListingPage';

const GRID = 'grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-4';

export default function AgentsPage(): JSX.Element {
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [appliedQ, setAppliedQ] = useState('');

  const results = useAsyncData(
    () => agentsApi.list({ page, pageSize: 12, q: appliedQ || undefined }),
    [appliedQ, page],
  );

  const resultCount = results.data?.meta?.total ?? 0;
  const totalPages = results.data?.meta?.totalPages ?? 1;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAppliedQ(q.trim());
    setPage(1);
  };

  const clear = () => {
    setQ('');
    setAppliedQ('');
    setPage(1);
  };

    return (
      <div className="container-page py-10">
        <Seo
          title="Agents immobiliers au Burundi"
          description="Trouvez un agent immobilier vérifié au Burundi : agences et courtiers à Bujumbura, Gitega, Ngozi et dans les 18 provinces. Achetez ou louez en confiance."
          path="/agents"
          keywords="agent immobilier Burundi, agence immobilière Bujumbura, courtier immobilier Burundi, real estate agent Burundi"
          jsonLd={withGlobalJsonLd(null)}
        />
        <CategoryHero eyebrow={t('agents.eyebrow')} title={t('agents.title')} subtitle={t('agents.subtitle')} />

      {/* Search + results */}
      <div className="mt-8" aria-live="polite">
        <form
          onSubmit={submit}
          role="search"
          className="flex h-12 w-full max-w-xl items-center gap-2 rounded-full border border-gray-200 bg-field pl-4 pr-2 transition-colors focus-within:border-gray-300 focus-within:bg-surface"
        >
          <Search className="h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.propertyAgent')}
            aria-label={t('search.propertyAgent')}
            className="min-w-0 flex-1 bg-transparent font-medium text-gray-900 outline-none placeholder:font-medium placeholder:text-placeholder"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
          <button type="submit" className="flex h-8 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white">
            {t('common.search')}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {resultCount} {resultCount === 1 ? t('common.results') : t('common.results')}
          </p>
          {appliedQ ? (
            <button type="button" onClick={clear} className="text-sm font-medium text-brand-700 hover:underline">
              {t('common.clear')}
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          {results.loading ? (
            <div className={GRID}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : results.error ? (
            <ErrorState title={t('error.loadFailed')} message={results.error} onRetry={results.reload} />
          ) : results.data && results.data.items.length > 0 ? (
            <div className={GRID}>
              {results.data.items.map((a) => (
                <AgentCard key={a.id} agent={a} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('agents.empty')}
              description={t('agents.emptyDesc')}
              icon={<Users className="h-10 w-10" />}
            />
          )}
        </div>
      </div>

      {totalPages > 1 && !results.loading ? (
        <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label={t('common.pagination')}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline">
            «
          </button>
          {Array.from({ length: totalPages }).slice(0, 10).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                aria-current={pageNum === page ? 'page' : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  pageNum === page ? 'bg-ink text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-outline">
            »
          </button>
        </nav>
      ) : null}
    </div>
  );
}