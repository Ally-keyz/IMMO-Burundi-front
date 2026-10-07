import { ArrowRight, Building2 } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import type { PropertySearchQuery } from '@immo/shared-types';
import { useLanguage } from '../../contexts/LanguageContext';
import { propertiesApi } from '../../lib/api';
import { useAsyncData } from '../../lib/useAsyncData';
import { breadcrumbSchema, itemListSchema } from '../../lib/seo/jsonld';
import type { BreadcrumbItem } from '../../lib/seo/jsonld';
import { Seo, withGlobalJsonLd } from '../seo/Seo';
import PropertyCard from '../PropertyCard';
import PropertyCardSkeleton from '../PropertyCardSkeleton';
import EmptyState from '../EmptyState';
import ErrorState from '../ErrorState';

const GRID = 'grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-3';

interface CategoryListingPageProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  query: PropertySearchQuery;
  /** Link to the full search experience with the same filters applied. */
  openSearchTo?: string;
  pageSize?: number;
  seo?: {
    title: string;
    description: string;
    keywords?: string;
    breadcrumbs?: BreadcrumbItem[];
  };
}

/** Banner used on curated listing pages (Buy, Rent, Land, Featured, ...). */
export function CategoryHero({ eyebrow, title, subtitle, action }: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: JSX.Element;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-meta text-gray-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * Generic paginated listing page: fetches PropertySummaryDTO via the shared
 * properties search endpoint and renders a card grid with skeletons,
 * empty / error states and numbered pagination.
 */
export default function CategoryListingPage({
  eyebrow,
  title,
  subtitle,
  query,
  openSearchTo,
  pageSize = 12,
  seo,
}: CategoryListingPageProps): JSX.Element {
  const { t } = useLanguage();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Pagination is driven by the URL rather than component state so that every
  // result page is a real, crawlable link. Button-based pagination is
  // invisible to crawlers and can never enter the index.
  const requestedPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(requestedPage) && requestedPage > 1 ? Math.floor(requestedPage) : 1;

  const pageSearch = (target: number): URLSearchParams => {
    const next = new URLSearchParams(searchParams);
    if (target <= 1) next.delete('page');
    else next.set('page', String(target));
    return next;
  };

  const goToPage = (target: number): void => {
    setSearchParams(pageSearch(target), { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtersKey = JSON.stringify({ ...query, page, pageSize });
  const results = useAsyncData(() => propertiesApi.search({ ...query, page, pageSize }), [filtersKey]);

  const resultCount = results.data?.meta?.total ?? 0;
  const totalPages = results.data?.meta?.totalPages ?? 1;
  const items = results.data?.items ?? [];

  const jsonLd = items.length
    ? withGlobalJsonLd([
        ...(seo?.breadcrumbs ? [breadcrumbSchema(seo.breadcrumbs)] : []),
        itemListSchema(
          seo?.title ?? title,
          items.map((p) => ({ name: p.title, path: `/property/${p._id}` })),
        ),
      ])
    : withGlobalJsonLd(seo?.breadcrumbs ? breadcrumbSchema(seo.breadcrumbs) : null);

  return (
    <div className="container-page py-10">
      <Seo
        title={seo?.title ?? title}
        description={seo?.description ?? subtitle ?? title}
        path={location.pathname}
        keywords={seo?.keywords}
        jsonLd={jsonLd}
      />
      <CategoryHero
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        action={
          openSearchTo ? (
            <Link
              to={openSearchTo}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-gray-200 px-6 text-ui font-medium text-gray-900 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
            >
              {t('cat.openSearch')}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : undefined
        }
      />

      <div className="mt-8" aria-live="polite">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {resultCount} {resultCount === 1 ? t('search.results') : t('search.resultsPlural')}
          </p>
        </div>

        {results.loading ? (
          <div className={GRID}>
            <PropertyCardSkeleton count={pageSize} />
          </div>
        ) : results.error ? (
          <ErrorState title={t('error.loadFailed')} message={results.error} onRetry={results.reload} />
        ) : results.data && items.length > 0 ? (
          <div className={GRID}>
            {items.map((p) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('empty.noProperties')}
            description={t('empty.noPropertiesDesc')}
            icon={<Building2 className="h-10 w-10" />}
          />
        )}
      </div>

      {totalPages > 1 && !results.loading ? (
        <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label={t('common.pagination')}>
          {page > 1 ? (
            <Link
              to={{ search: pageSearch(page - 1).toString() }}
              className="btn-outline"
              rel="prev"
              aria-label={t('common.previous')}
            >
              «
            </Link>
          ) : (
            <span className="btn-outline pointer-events-none opacity-40" aria-hidden="true">«</span>
          )}
          {Array.from({ length: totalPages }).slice(0, 10).map((_, i) => {
            const pageNum = i + 1;
            return (
              <Link
                key={pageNum}
                to={{ search: pageSearch(pageNum).toString() }}
                onClick={(event) => {
                  // Intercept for SPA navigation but keep a real href so that
                  // crawlers and "open in new tab" both behave correctly.
                  event.preventDefault();
                  goToPage(pageNum);
                }}
                aria-current={pageNum === page ? 'page' : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  pageNum === page ? 'bg-ink text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
          {page < totalPages ? (
            <Link
              to={{ search: pageSearch(page + 1).toString() }}
              className="btn-outline"
              rel="next"
              aria-label={t('common.next')}
            >
              »
            </Link>
          ) : (
            <span className="btn-outline pointer-events-none opacity-40" aria-hidden="true">»</span>
          )}
        </nav>
      ) : null}
    </div>
  );
}