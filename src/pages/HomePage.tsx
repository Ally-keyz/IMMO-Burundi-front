import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  Building2,
  Heart,
  MapPin,
  Sparkles,
  Star,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi } from '../lib/api';
import { hasSearchedBefore } from '../lib/search';
import { useAsyncData } from '../lib/useAsyncData';
import type { PopularLocation } from '../lib/api';
import type { PropertySummaryDTO } from '@immo/shared-types';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import PropertyCardSkeleton from '../components/PropertyCardSkeleton';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import HeroSection from '../components/explore/HeroSection';
import CategoryTiles from '../components/explore/CategoryTiles';
import type { CategoryTile } from '../components/explore/CategoryTiles';
import SectionHeader from '../components/explore/SectionHeader';
import { itemListSchema } from '../lib/seo/jsonld';
import { Seo, withGlobalJsonLd } from '../components/seo/Seo';
import { formatNumber } from '../lib/format';

import { MEDIA_PLACEHOLDER_COLORS } from '../lib/constants';

const GRID = 'grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-4';

function primaryImage(p: PropertySummaryDTO): string {
  const primary = p.media?.find((m) => m.isPrimary) ?? p.media?.[0];
  return primary?.url ?? primary?.thumbUrl ?? '';
}

function ViewAllLink({ to, label }: { to: string; label: string }): JSX.Element {
  return (
    <Link
      to={to}
      className="inline-flex h-12 items-center gap-2 rounded-full border border-gray-200 px-6 text-ui font-medium text-gray-900 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}

function PersonalizedButton({ onClick }: { onClick: () => void }): JSX.Element {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 items-center gap-3 rounded-full border border-gray-300 px-6 text-ui font-medium text-gray-900 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 desktop:w-[313px] desktop:justify-center"
    >
      <Sparkles className="h-6 w-6 text-accent" aria-hidden="true" />
      {t('feed.personalize')}
    </button>
  );
}

export default function HomePage(): JSX.Element {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [searched] = useState(() => hasSearchedBefore());
  const showRecommended = isAuthenticated || searched;

  const featured = useAsyncData(() => propertiesApi.getFeatured(8), []);
  const recent = useAsyncData(() => propertiesApi.getRecent(8), []);
  const verified = useAsyncData(() => propertiesApi.getVerified(8), []);
  const locations = useAsyncData(() => propertiesApi.getPopularLocations(8), []);

  /* Photos from the featured feed reused as location-card backgrounds so the
     "popular locations" grid no longer renders as flat gradient tiles. */
  const locationPhotos = useMemo(
    () => (featured.data ?? []).map(primaryImage).filter(Boolean),
    [featured.data],
  );

  const tiles = useMemo(() => {
    const photos = (featured.data ?? []).map(primaryImage).filter(Boolean);
    const pick = (() => {
      let i = 0;
      return () => photos[i++ % Math.max(photos.length, 1)];
    })();
    const result: CategoryTile[] = [
    {
      id: 'for-you',
      label: t('home.forYou'),
      icon: <Star className="h-6 w-6 desktop:h-7 desktop:w-7" />,
      hero: 'accent',
      onClick: () => navigate('/search'),
    },
    {
      id: 'saved',
      label: t('home.saved'),
      icon: <Heart className="h-6 w-6 desktop:h-7 desktop:w-7" />,
      hero: 'ink',
      onClick: () => navigate(isAuthenticated ? '/dashboard?tab=favorites' : '/login'),
    },
    {
      id: 'featured',
      label: t('nav.featured'),
      icon: <Award className="h-6 w-6 desktop:h-7 desktop:w-7" />,
      hero: 'navy',
      onClick: () => navigate('/featured'),
    },
  ];
  const photoTiles = [
    { id: 'apartments', label: t('tiles.apartments'), to: '/search?propertyType=APARTMENT' },
    { id: 'houses', label: t('tiles.houses'), to: '/search?propertyType=HOUSE' },
    { id: 'villas', label: t('tiles.villas'), to: '/search?propertyType=VILLA' },
    { id: 'land', label: t('tiles.land'), to: '/search?propertyType=LAND' },
    { id: 'commercial', label: t('tiles.commercial'), to: '/search?propertyType=COMMERCIAL' },
    { id: 'rentals', label: t('tiles.rentals'), to: '/search?listingType=RENT' },
    { id: 'for-sale', label: t('tiles.forSale'), to: '/search?listingType=SALE' },
  ];
  photoTiles.forEach((p) => {
    result.push({ id: p.id, label: p.label, imageUrl: pick(), onClick: () => navigate(p.to) });
  });
  return result;
}, [featured.data, isAuthenticated, navigate, t]);

  const homeJsonLd = withGlobalJsonLd(
    featured.data && featured.data.length
      ? itemListSchema(
          'Propriétés en vedette au Burundi',
          featured.data.map((p) => ({ name: p.title, path: `/property/${p._id}` })),
        )
      : null,
  );

  return (
    <div>
      <Seo
        title="Achat et location immobilière au Burundi"
        description="IMMO BURUNDI : trouvez votre maison, villa, appartement ou terrain à Bujumbura et dans les 18 provinces. Achat, location et vente de propriétés au Burundi, prix en BIF, annonces vérifiées."
        path="/"
        keywords="immobilier Burundi, achat immobilier Bujumbura, location maison Burundi, maison à vendre Burundi, terrain à vendre Burundi, property for sale Burundi, real estate Burundi"
        jsonLd={homeJsonLd}
      />
      <span className="sr-only">{t('home.tagline')}</span>

      {/* ── Hero: image card with headline + existing search/filter ── */}
      <HeroSection onFilterClick={() => setAdvancedOpen(true)} />

      {/* ── Category tiles (32px below the hero) ── */}
      <section className="container-page mt-8" aria-label={t('tiles.explore')}>
        <CategoryTiles tiles={tiles} activeId="for-you" ariaLabel={t('tiles.explore')} />
      </section>

      {/* ── Recommended for you (only after auth or a search) ── */}
      {showRecommended ? (
        <section className="container-page pt-10">
          <SectionHeader
            title={t('feed.title')}
            desc={t('feed.desc')}
            action={<PersonalizedButton onClick={() => setAdvancedOpen(true)} />}
          />
          {featured.loading ? (
            <div className={GRID}>
              <PropertyCardSkeleton count={8} />
            </div>
          ) : featured.error ? (
            <ErrorState title={t('error.loadFailed')} message={featured.error} onRetry={featured.reload} />
          ) : featured.data && featured.data.length > 0 ? (
            <div className={GRID}>
              {featured.data.map((p) => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          ) : (
            <EmptyState title={t('empty.noProperties')} description={t('empty.noPropertiesDesc')} icon={<Building2 className="h-10 w-10" />} />
          )}
        </section>
      ) : null}

      {/* ── Recently added ─────────────────────────────────── */}
      <section className="container-page pt-14">
        <SectionHeadingInline
          title={t('home.recent')}
          desc={t('home.recentDesc')}
          action={<ViewAllLink to="/search?sort=newest" label={t('common.viewAll')} />}
        />
        {recent.loading ? (
          <div className={GRID}><PropertyCardSkeleton count={8} /></div>
        ) : recent.error ? (
          <ErrorState title={t('error.loadFailed')} message={recent.error} onRetry={recent.reload} />
        ) : recent.data && recent.data.length > 0 ? (
          <div className={GRID}>
            {recent.data.map((p) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        ) : (
          <EmptyState title={t('empty.noProperties')} description={t('empty.noPropertiesDesc')} />
        )}
      </section>

      {/* ── Popular locations ──────────────────────────────── */}
      <section className="container-page pt-14">
        <SectionHeadingInline
          title={t('home.popularLocations')}
          desc={t('home.popularLocationsDesc')}
          action={<ViewAllLink to="/search" label={t('common.viewAll')} />}
        />
        {locations.loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : locations.error ? (
          <ErrorState title={t('error.loadFailed')} message={locations.error} onRetry={locations.reload} />
        ) : locations.data && locations.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {locations.data.map((loc: PopularLocation, i) => {
              const grad = MEDIA_PLACEHOLDER_COLORS[i % MEDIA_PLACEHOLDER_COLORS.length];
              const photo = locationPhotos[i % Math.max(locationPhotos.length, 1)];
              return (
                <Link
                  key={loc.provinceId}
                  to={`/search?province=${encodeURIComponent(loc.provinceId)}`}
                  className="group relative flex h-28 items-end overflow-hidden rounded-2xl bg-gray-200 p-4 text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${grad}`} aria-hidden="true" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-gray-950/20 to-transparent" aria-hidden="true" />
                  <div className="relative z-10">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {loc.name}
                    </p>
                    <p className="text-xs text-white/80">
                      {formatNumber(loc.count)} {t('common.properties')}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t('empty.noResults')} icon={<Building2 className="h-10 w-10" />} />
        )}
      </section>

      {/* ── Verified properties ────────────────────────────── */}
      <section className="container-page pt-14">
        <SectionHeadingInline
          title={t('home.verified')}
          desc={t('home.verifiedDesc')}
          action={
            <Link
              to="/verified"
              className="inline-flex h-12 items-center gap-3 rounded-full border border-gray-200 px-6 text-ui font-medium text-gray-900 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
            >
              <BadgeCheck className="h-6 w-6 text-verified" aria-hidden="true" />
              {t('common.viewAll')}
            </Link>
          }
        />
        {verified.loading ? (
          <div className={GRID}><PropertyCardSkeleton count={8} /></div>
        ) : verified.error ? (
          <ErrorState title={t('error.loadFailed')} message={verified.error} onRetry={verified.reload} />
        ) : verified.data && verified.data.length > 0 ? (
          <div className={GRID}>
            {verified.data.map((p) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
        ) : (
          <EmptyState title={t('empty.noProperties')} description={t('empty.noPropertiesDesc')} />
        )}
      </section>

      {/* ── Advanced search modal (keeps existing SearchBar feature) ── */}
      <Modal open={advancedOpen} onClose={() => setAdvancedOpen(false)} title={t('search.advancedTitle')} size="lg">
        <p className="-mt-2 mb-4 text-sm text-gray-500">{t('search.advancedDesc')}</p>
        <SearchBar className="" />
      </Modal>
    </div>
  );
}

function SectionHeadingInline({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: JSX.Element;
}): JSX.Element {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-h2 font-bold text-gray-900">{title}</h2>
        {desc ? <p className="mt-1 text-meta text-gray-500">{desc}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}