import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, SlidersHorizontal, X } from 'lucide-react';
import type { PropertySearchQuery } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { propertiesApi, geoApi } from '../lib/api';
import { useAsyncData } from '../lib/useAsyncData';
import { markSearchPerformed } from '../lib/search';
import PropertyCard from '../components/PropertyCard';
import PropertyCardSkeleton from '../components/PropertyCardSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ExploreToolbar from '../components/explore/ExploreToolbar';
import { PROPERTY_TYPE_OPTIONS, LISTING_TYPE_OPTIONS, VERIFICATION_FILTER_OPTIONS, SORT_OPTIONS, FALLBACK_PROVINCES } from '../lib/constants';
import type { SortValue, GeoOption } from '../lib/constants';
import { itemListSchema } from '../lib/seo/jsonld';
import { Seo, withGlobalJsonLd } from '../components/seo/Seo';

interface SearchFilterState {
  q: string;
  province: string;
  commune: string;
  propertyType: string;
  listingType: string;
  minPrice: string;
  maxPrice: string;
  minSurface: string;
  maxSurface: string;
  bedrooms: string;
  verificationStatus: string;
  featured: boolean;
  sort: SortValue;
  page: number;
}

const DEFAULT_FILTERS: SearchFilterState = {
  q: '',
  province: '',
  commune: '',
  propertyType: '',
  listingType: '',
  minPrice: '',
  maxPrice: '',
  minSurface: '',
  maxSurface: '',
  bedrooms: '',
  verificationStatus: '',
  featured: false,
  sort: 'newest',
  page: 1,
};

function fromSearchParams(sp: URLSearchParams): SearchFilterState {
  return {
    q: sp.get('q') ?? '',
    province: sp.get('province') ?? '',
    commune: sp.get('commune') ?? '',
    propertyType: sp.get('propertyType') ?? '',
    listingType: sp.get('listingType') ?? '',
    minPrice: sp.get('minPrice') ?? '',
    maxPrice: sp.get('maxPrice') ?? '',
    minSurface: sp.get('minSurface') ?? '',
    maxSurface: sp.get('maxSurface') ?? '',
    bedrooms: sp.get('bedrooms') ?? '',
    verificationStatus: sp.get('verificationStatus') ?? '',
    featured: sp.get('isFeatured') === 'true',
    sort: (SORT_OPTIONS.some((s) => s.value === sp.get('sort')) ? (sp.get('sort') as SortValue) : 'newest'),
    page: Math.max(1, Number(sp.get('page')) || 1),
  };
}

function toParams(f: SearchFilterState): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.province) sp.set('province', f.province);
  if (f.commune) sp.set('commune', f.commune);
  if (f.propertyType) sp.set('propertyType', f.propertyType);
  if (f.listingType) sp.set('listingType', f.listingType);
  if (f.minPrice) sp.set('minPrice', f.minPrice);
  if (f.maxPrice) sp.set('maxPrice', f.maxPrice);
  if (f.minSurface) sp.set('minSurface', f.minSurface);
  if (f.maxSurface) sp.set('maxSurface', f.maxSurface);
  if (f.bedrooms) sp.set('bedrooms', f.bedrooms);
  if (f.verificationStatus) sp.set('verificationStatus', f.verificationStatus);
  if (f.featured) sp.set('isFeatured', 'true');
  if (f.sort !== 'newest') sp.set('sort', f.sort);
  if (f.page > 1) sp.set('page', String(f.page));
  return sp;
}

function buildQuery(f: SearchFilterState): PropertySearchQuery {
  const q: PropertySearchQuery = {};
  if (f.q) q.q = f.q;
  if (f.province) q.province = f.province;
  if (f.commune) q.commune = f.commune;
  if (f.propertyType) q.propertyType = f.propertyType as PropertySearchQuery['propertyType'];
  if (f.listingType) q.listingType = f.listingType as PropertySearchQuery['listingType'];
  if (f.minPrice) q.minPrice = Number(f.minPrice);
  if (f.maxPrice) q.maxPrice = Number(f.maxPrice);
  if (f.minSurface) q.minSurface = Number(f.minSurface);
  if (f.maxSurface) q.maxSurface = Number(f.maxSurface);
  if (f.bedrooms) q.bedrooms = Number(f.bedrooms);
  if (f.verificationStatus) q.verificationStatus = f.verificationStatus as PropertySearchQuery['verificationStatus'];
  if (f.featured) q.isFeatured = true;

  switch (f.sort) {
    case 'priceAsc':
      q.sortBy = 'price.amount';
      q.sortOrder = 'asc';
      break;
    case 'priceDesc':
      q.sortBy = 'price.amount';
      q.sortOrder = 'desc';
      break;
    case 'views':
      q.sortBy = 'stats.views';
      q.sortOrder = 'desc';
      break;
    case 'featured':
      q.isFeatured = true;
      q.sortBy = 'publishedAt';
      q.sortOrder = 'desc';
      break;
    default:
      q.sortBy = f.sort === 'newest' ? 'publishedAt' : undefined;
      q.sortOrder = 'desc';
  }
  q.page = f.page;
  q.pageSize = 12;
  return q;
}

export default function SearchPage(): JSX.Element {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilterState>(() => fromSearchParams(searchParams));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtersKey = JSON.stringify(filters);
  const query = useMemo(() => buildQuery(filters), [filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useAsyncData(() => propertiesApi.search(query), [filtersKey]);
  const provinces = useAsyncData<GeoOption[]>(
    () => geoApi.getProvinces().then((ps) => ps as GeoOption[]).catch(() => FALLBACK_PROVINCES),
    [],
  );
  const communes = useAsyncData<GeoOption[]>(
    () => (filters.province ? geoApi.getCommunes(filters.province).then((cs) => cs as GeoOption[]).catch(() => []) : Promise.resolve([])),
    [filters.province],
  );

  useEffect(() => {
    setSearchParams(toParams(filters), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  /* ── SEO ─────────────────────────────────────────── */
  /* /search is the catch-all result page. Its canonical URL is always the
     bare path so that the unbounded filter space (?page, ?sortBy, arbitrary
     queries) does not generate duplicate content competing with /buy,
     /rent, /land and /commercial. */
  const resultItems = results.data?.items ?? [];
  const totalResults = results.data?.meta?.total ?? 0;

  const searchFilters: string[] = [];
  if (filters.listingType) searchFilters.push(filters.listingType === 'RENT' ? 'location' : 'achat');
  if (filters.propertyType) searchFilters.push(t(`propertyType.${filters.propertyType}`));
  const selectedProvince = provinces.data?.find((p) => p._id === filters.province);
  const selectedCommune = communes.data?.find((c) => c._id === filters.commune);
  const placeName = selectedCommune?.name ?? selectedProvince?.name;
  if (placeName) searchFilters.push(placeName);
  if (filters.minPrice || filters.maxPrice) searchFilters.push('tous budgets');

  const searchSeoTitle = [
    'Recherche immobilière',
    ...searchFilters.slice(0, 3),
    'au Burundi',
  ]
    .filter(Boolean)
    .join(' ');

  const searchSeoDescription =
    `${totalResults} propriété${totalResults > 1 ? 's' : ''} disponible${
      totalResults > 1 ? 's' : ''
    }` +
    `${placeName ? ` à ${placeName}` : ' au Burundi'}. Filtrez par type, budget, ` +
    'province et commune sur IMMO BURUNDI. Prix en BIF, annonces vérifiées.';

  const searchJsonLd = resultItems.length
    ? itemListSchema(
        searchSeoTitle,
        resultItems.map((p) => ({ name: p.title, path: `/property/${p._id}` })),
      )
    : null;

  const update = (patch: Partial<SearchFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  };

  const resetAll = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const resultCount = results.data?.meta?.total ?? 0;
  const totalPages = results.data?.meta?.totalPages ?? 1;
  const provinceOptions = provinces.data ?? [];
  const communeOptions = communes.data ?? [];

  const activeFilterCount = [
    filters.province,
    filters.commune,
    filters.propertyType,
    filters.listingType,
    filters.minPrice,
    filters.maxPrice,
    filters.minSurface,
    filters.maxSurface,
    filters.bedrooms,
    filters.verificationStatus,
    filters.featured ? 'featured' : '',
  ].filter(Boolean).length;

  const onFilterPill = () => {
    setFiltersOpen(true);
  };

  const filterBody = (
    <div className="space-y-6">
      {/* Province / commune */}
      <div>
        <label htmlFor="f-province" className="label">{t('search.province')}</label>
        <select
          id="f-province"
          className="input"
          value={filters.province}
          onChange={(e) => update({ province: e.target.value, commune: '' })}
        >
          <option value="">{t('common.all')}</option>
          {provinceOptions.map((p) => (
            <option key={p._id ?? p.code} value={p._id ?? p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-commune" className="label">{t('search.commune')}</label>
        <select
          id="f-commune"
          className="input"
          disabled={!filters.province}
          value={filters.commune}
          onChange={(e) => update({ commune: e.target.value })}
        >
          <option value="">{t('common.all')}</option>
          {communeOptions.map((c) => (
            <option key={c._id ?? c.code} value={c._id ?? c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Property / listing type */}
      <div>
        <label htmlFor="f-type" className="label">{t('search.propertyType')}</label>
        <select id="f-type" className="input" value={filters.propertyType} onChange={(e) => update({ propertyType: e.target.value })}>
          <option value="">{t('common.all')}</option>
          {PROPERTY_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-listing" className="label">{t('search.listingType')}</label>
        <select id="f-listing" className="input" value={filters.listingType} onChange={(e) => update({ listingType: e.target.value })}>
          <option value="">{t('common.all')}</option>
          {LISTING_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
          ))}
        </select>
      </div>

      {/* Price range (sliders + values) */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-gray-700">{t('search.priceRange')}</span>
        <div className="flex items-center justify-between text-xs font-semibold text-brand-700">
          <span>{filters.minPrice ? Number(filters.minPrice).toLocaleString() : '0'}</span>
          <span>{filters.maxPrice ? Number(filters.maxPrice).toLocaleString() : '—'}</span>
        </div>
        <label htmlFor="f-min-price" className="sr-only">Min price slider</label>
        <input
          id="f-min-price"
          type="range"
          min={0}
          max={2000000000}
          step={25000000}
          value={filters.minPrice || 0}
          onChange={(e) => update({ minPrice: e.target.value })}
          className="mt-2 w-full accent-brand-600"
        />
        <label htmlFor="f-max-price" className="sr-only">Max price slider</label>
        <input
          id="f-max-price"
          type="range"
          min={0}
          max={2000000000}
          step={25000000}
          value={filters.maxPrice || 2000000000}
          onChange={(e) => update({ maxPrice: e.target.value })}
          className="mt-2 w-full accent-brand-600"
        />
      </div>

      {/* Bedrooms */}
      <div>
        <label htmlFor="f-bed" className="label">{t('search.bedrooms')}</label>
        <select id="f-bed" className="input" value={filters.bedrooms} onChange={(e) => update({ bedrooms: e.target.value })}>
          <option value="">{t('common.any')}</option>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </div>

      {/* Surface */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-min-surface" className="label">{t('search.minSurface')}</label>
          <input id="f-min-surface" type="number" min={0} className="input" value={filters.minSurface} onChange={(e) => update({ minSurface: e.target.value })} />
        </div>
        <div>
          <label htmlFor="f-max-surface" className="label">{t('search.maxSurface')}</label>
          <input id="f-max-surface" type="number" min={0} className="input" value={filters.maxSurface} onChange={(e) => update({ maxSurface: e.target.value })} />
        </div>
      </div>

      {/* Verification */}
      <div>
        <label htmlFor="f-verification" className="label">{t('search.verificationStatus')}</label>
        <select id="f-verification" className="input" value={filters.verificationStatus} onChange={(e) => update({ verificationStatus: e.target.value })}>
          <option value="">{t('common.all')}</option>
          {VERIFICATION_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
          ))}
        </select>
      </div>

      {/* Featured */}
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={filters.featured}
          onChange={(e) => update({ featured: e.target.checked })}
          className="h-4 w-4 rounded accent-brand-600"
        />
        {t('search.featured')}
      </label>
    </div>
  );

    return (
      <div className="container-page py-8">
        <Seo
          title={searchSeoTitle}
          description={searchSeoDescription}
          path="/search"
          keywords="recherche immobilière Burundi, trouver propriété Burundi, immobilier Bujumbura, filtrer propriétés Burundi, property search Burundi"
          jsonLd={withGlobalJsonLd(searchJsonLd)}
        />
        {/* Behance-style search bar row */}
      <ExploreToolbar
        key={filters.q}
        initialQuery={filters.q}
        sort={filters.sort}
        onSortChange={(v) => update({ sort: v as SortValue })}
        onSearch={(q, _segment, sortValue) => {
          markSearchPerformed();
          update({ q, sort: sortValue as SortValue, page: 1 });
        }}
        onFilterClick={onFilterPill}
        filterBadgeCount={activeFilterCount}
      />

      <div className="mt-8">
        {/* Results count */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600" aria-live="polite">
              {resultCount} {resultCount === 1 ? t('search.results') : t('search.resultsPlural')}
            </p>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn-outline lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {t('common.filters')}
            </button>
          </div>

          {/* Results */}
          <div className="mt-6">
            {results.loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-3">
                <PropertyCardSkeleton count={6} />
              </div>
            ) : results.error ? (
              <ErrorState title={t('error.generic')} message={results.error} onRetry={results.reload} retryLabel={t('error.retry')} />
            ) : results.data && results.data.items.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-3">
                {results.data.items.map((p) => (
                  <PropertyCard key={p._id} property={p} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={t('empty.noResults')}
                description={t('empty.noResultsDesc')}
                icon={<Building2 className="h-10 w-10" />}
                actionLabel={t('search.resetFilters')}
                onAction={resetAll}
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !results.loading ? (
            <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label={t('common.pagination')}>
              <button
                type="button"
                disabled={filters.page <= 1}
                onClick={() => update({ page: filters.page - 1 })}
                className="btn-outline"
              >
                «
              </button>
              {Array.from({ length: totalPages }).slice(0, 10).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => update({ page: pageNum })}
                    aria-current={pageNum === filters.page ? 'page' : undefined}
                    className={`h-10 w-10 rounded-full text-base font-medium transition-colors ${
                      pageNum === filters.page ? 'bg-ink text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={filters.page >= totalPages}
                onClick={() => update({ page: filters.page + 1 })}
                className="btn-outline"
              >
                »
              </button>
            </nav>
          ) : null}
      </div>

      {/* Personalize modal */}
      {filtersOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-pop"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('search.personalize')}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <SlidersHorizontal className="h-5 w-5 text-accent" aria-hidden="true" />
                {t('search.personalize')}
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{filterBody}</div>
            <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-4">
              <button type="button" onClick={resetAll} className="btn-outline flex-1">
                <X className="h-4 w-4" aria-hidden="true" />
                {t('search.resetFilters')}
              </button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="btn-dark flex-1">
                {t('common.apply')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}