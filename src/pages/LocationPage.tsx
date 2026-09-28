import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { geoApi, propertiesApi } from '../lib/api';
import type { GeoOption } from '../lib/constants';
import { useAsyncData } from '../lib/useAsyncData';
import { COUNTRY, findProvinceBySlug, locationPath, slugify } from '../lib/seo/locations';
import { breadcrumbSchema, itemListSchema } from '../lib/seo/jsonld';
import { Seo, withGlobalJsonLd } from '../components/seo/Seo';
import PropertyCard from '../components/PropertyCard';
import PropertyCardSkeleton from '../components/PropertyCardSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

/**
 * SEO landing page for a province, e.g. /immobilier/gitega.
 *
 * These are the pages that compete for local queries such as
 * "maison a vendre Gitega" or "terrain a batir Ngozi". Each one has unique
 * copy, a self-referencing canonical, an ItemList of live listings and a
 * breadcrumb trail, and is prerendered at build time.
 */
export default function LocationPage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const province = findProvinceBySlug(slug);

  // Resolve the static slug to the database province id so the listing query
  // uses the same identifier as the rest of the app.
  const provinces = useAsyncData<GeoOption[]>(
    () => geoApi.getProvinces().catch(() => []),
    [],
  );

  const provinceId = useMemo(() => {
    if (!province) return undefined;
    return provinces.data?.find((p) => slugify(p.name) === province.slug)?._id;
  }, [province, provinces.data]);

  const listings = useAsyncData(
    () =>
      provinceId
        ? propertiesApi.search({
            province: provinceId,
            page: 1,
            pageSize: 12,
            sortBy: 'publishedAt',
            sortOrder: 'desc',
          })
        : Promise.resolve(null),
    [provinceId],
  );

  if (!province) {
    return (
      <div className="container-page py-16">
        <Seo
          title="Zone inconnue"
          description="Cette page de zone n'existe pas sur IMMO BURUNDI."
          path={locationPath(slug ?? '')}
          noindex
        />
        <EmptyState
          title={t('error.notFound')}
          description={t('error.notFoundDesc')}
          icon={<MapPin className="h-10 w-10" />}
        />
      </div>
    );
  }

  const items = listings.data?.items ?? [];
  const total = listings.data?.meta?.total ?? 0;
  const searchHref = provinceId ? `/search?province=${encodeURIComponent(provinceId)}` : '/search';

  const title = `Immobilier a ${province.name} : achat et location`;
  const availability =
    total > 0
      ? `${total} annonce${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}.`
      : 'Consultez les annonces disponibles.';
  const description =
    `${province.blurb} ${availability} ` +
    `Achat et location de maisons, villas, appartements et terrains a ${province.name}, ${COUNTRY}.`;

  return (
    <div className="container-page py-10">
      <Seo
        title={title}
        description={description}
        path={locationPath(province.slug)}
        keywords={`immobilier ${province.name}, maison a vendre ${province.name}, terrain a batir ${province.name}, acheter propriété ${province.name}, location ${province.name}, real estate ${province.name}`}
        jsonLd={withGlobalJsonLd([
          breadcrumbSchema([
            { name: 'Accueil', path: '/' },
            { name: 'Immobilier', path: '/search' },
            { name: province.name, path: locationPath(province.slug) },
          ]),
          ...(items.length
            ? [
                itemListSchema(
                  `Immobilier a ${province.name}`,
                  items.map((p) => ({ name: p.title, path: `/property/${p._id}` })),
                ),
              ]
            : []),
        ])}
      />

      <header className="max-w-3xl">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {COUNTRY}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Immobilier a {province.name} : achat et location
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray-600">{province.blurb}</p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label={t('common.navigation')}>
        <Link to="/buy" className="btn-outline">
          {t('cat.buy.title')}
        </Link>
        <Link to="/rent" className="btn-outline">
          {t('cat.rent.title')}
        </Link>
        <Link to="/land" className="btn-outline">
          {t('cat.land.title')}
        </Link>
        <Link to={searchHref} className="btn-outline">
          {t('cat.openSearch')}
        </Link>
      </nav>

      <div className="mt-8" aria-live="polite">
        <p className="mb-4 text-sm text-gray-600">
          {total} {total === 1 ? t('search.results') : t('search.resultsPlural')}
        </p>

        {listings.loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-4">
            <PropertyCardSkeleton count={8} />
          </div>
        ) : listings.error ? (
          <ErrorState title={t('error.loadFailed')} message={listings.error} onRetry={listings.reload} />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-4">
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

      {provinceId ? (
        <p className="mt-10 text-sm text-gray-500">
          <Link to={searchHref} className="font-medium text-brand-600 hover:underline">
            {t('cat.openSearch')}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
