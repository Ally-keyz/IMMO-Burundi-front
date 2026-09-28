import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Star,
  User,
  X,
} from 'lucide-react';
import type { AgentSummary, PropertySearchQuery, PropertySummaryDTO } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { agentsApi, propertiesApi, type Paginated } from '../lib/api';
import { useAsyncData } from '../lib/useAsyncData';
import PropertyCard from '../components/PropertyCard';
import PropertyCardSkeleton from '../components/PropertyCardSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Modal from '../components/Modal';
import { LISTING_TYPE_OPTIONS } from '../lib/constants';
import type { ListingType } from '@immo/shared-types';

type SortId = 'latest' | 'popular' | 'priceAsc' | 'priceDesc';
type ChannelTab = 'home' | 'listings' | 'sold' | 'reviews' | 'about';

function initials(a: AgentSummary): string {
  return `${a.firstName[0] ?? ''}${a.lastName[0] ?? ''}`.toUpperCase() || 'A';
}

function waLink(phone: string | undefined, name: string): string {
  const text = encodeURIComponent(`Hello${name ? ` ${name}` : ''}, I found your profile on IMMO BURUNDI and I'd like to get in touch.`);
  if (phone) return `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}

export default function AgentChannelPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const agent = useAsyncData(() => agentsApi.get(id), [id]);

  const [tab, setTab] = useState<ChannelTab>('home');
  const [sort, setSort] = useState<SortId>('latest');
  const [listingType, setListingType] = useState<'' | ListingType>('');
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageSize, setPageSize] = useState(12);
  const [contactOpen, setContactOpen] = useState(false);
  const [bioMore, setBioMore] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);

  useEffect(() => {
    setTab('home');
    setSort('latest');
    setListingType('');
    setQ('');
    setSearchOpen(false);
    setPageSize(12);
    setBioMore(false);
    setLinksOpen(false);
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id]);

  const sortOptions = useMemo(
    () => [
      { id: 'latest', sortBy: 'publishedAt', order: 'desc' },
      { id: 'popular', sortBy: 'stats.views', order: 'desc' },
      { id: 'priceAsc', sortBy: 'price.amount', order: 'asc' },
      { id: 'priceDesc', sortBy: 'price.amount', order: 'desc' },
    ] as const,
    [],
  );

  const activeSort = sortOptions.find((s) => s.id === sort) ?? sortOptions[0];

  const searchQuery = useMemo<PropertySearchQuery>(() => {
    const query: PropertySearchQuery = { agentId: id, page: 1, pageSize };
    query.sortBy = activeSort.sortBy;
    query.sortOrder = activeSort.order;
    if (tab === 'sold' && isAuthenticated) query.status = 'SOLD';
    if (listingType) query.listingType = listingType;
    if (q.trim()) query.q = q.trim();
    return query;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tab, sort, listingType, q, pageSize, isAuthenticated]);

  const properties = useAsyncData<Paginated<PropertySummaryDTO>>(() => propertiesApi.search(searchQuery), [
    searchQuery.q,
    searchQuery.sortBy,
    searchQuery.sortOrder,
    searchQuery.status,
    searchQuery.listingType,
    searchQuery.agentId,
    searchQuery.page,
    searchQuery.pageSize,
  ]);

  const listings = properties.data?.items ?? [];
  const totalListings = properties.data?.meta.total ?? agent.data?.totalProperties ?? 0;

  const loadMore = () => setPageSize((n) => n + 12);

  /* ── Contact links (enriched from the public profile) ───── */
  const contactLinks = useMemo(() => {
    const links: { id: string; label: string; href: string }[] = [];
    if (agent.data?.email) links.push({ id: 'email', label: agent.data.email, href: `mailto:${agent.data.email}` });
    if (agent.data?.phone) links.push({ id: 'call', label: agent.data.phone, href: `tel:${agent.data.phone}` });
    if (agent.data?.phone) links.push({ id: 'wa', label: 'WhatsApp', href: waLink(agent.data.phone, agent.data.firstName) });
    if (agent.data?.agencyName?.length) {
      links.push({ id: 'agency', label: agent.data.agencyName, href: `mailto:${agent.data.email ?? ''}?subject=${encodeURIComponent('IMMO BURUNDI')}` });
    }
    return links;
  }, [agent.data]);

  const primaryLink = contactLinks[0];
  const extraLinks = contactLinks.slice(1);

  if (agent.loading) {
    return (
      <div className="pb-10">
        <div className="h-40 animate-pulse bg-gray-200 md:h-64" />
        <div className="container-page mt-6 flex items-center gap-4">
          <div className="h-28 w-28 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (agent.error || !agent.data) {
    return (
      <div className="container-page py-16">
        <ErrorState title={t('agent.notFound')} message={t('agent.notFoundDesc')} onRetry={agent.reload} />
      </div>
    );
  }

  const a = agent.data;
  const isTopAgent = a.topAgent;
  const handle = `@${a.licenseNumber || a.agentCode}`;
  const bannerUrl = listings[0]?.media?.find((m) => m.isPrimary)?.url ?? listings[0]?.media?.[0]?.url;
  const hasContact = Boolean(a.phone || a.email);

  const sortChips = (
    <div className="flex flex-wrap items-center gap-2">
      {(
        [
          { id: 'latest', label: t('agent.latest') },
          { id: 'popular', label: t('agent.popular') },
          { id: 'priceAsc', label: t('agent.priceAsc') },
          { id: 'priceDesc', label: t('agent.priceDesc') },
        ] as const
      ).map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => setSort(s.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            sort === s.id ? 'bg-ink text-white' : 'border border-gray-200 bg-surface text-gray-700 hover:bg-gray-50'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  const soldHidden = tab === 'sold' && !isAuthenticated;

  const renderFeed = () => (
    <div className="mt-6" aria-live="polite">
      {soldHidden ? (
        <EmptyState
          title={t('agent.soldHidden')}
          description={t('agent.soldHidden')}
          icon={<Building2 className="h-10 w-10" />}
        />
      ) : properties.loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 desktop:grid-cols-4">
          <PropertyCardSkeleton count={Math.min(pageSize, 8)} />
        </div>
      ) : properties.error ? (
        <ErrorState title={t('error.loadFailed')} message={properties.error} onRetry={properties.reload} />
      ) : listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 desktop:grid-cols-4">
            {listings.map((p) => (
              <PropertyCard key={p._id} property={p} />
            ))}
          </div>
          {listings.length < totalListings ? (
            <div className="mt-8 text-center">
              <button type="button" onClick={loadMore} disabled={properties.loading} className="btn-outline">
                {t('common.viewAll')}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          title={tab === 'sold' ? t('agent.soldHidden') : t('agent.empty')}
          description={tab === 'sold' ? t('agent.soldHidden') : t('agent.emptyDesc')}
          icon={<Building2 className="h-10 w-10" />}
        />
      )}
    </div>
  );

  const renderReviews = () => (
    <div className="max-w-2xl pb-10">
      <div className="mt-6 rounded-2xl border border-gray-200 bg-surface p-6">
        <div className="flex flex-wrap items-center gap-5">
          {a.rating ? (
            <div className="text-center">
              <p className="text-4xl font-black tracking-tight text-gray-900">{a.rating.toFixed(1)}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-gray-500">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                {t('agent.reviewsCount', { count: (a.reviewsCount ?? 0).toLocaleString() })}
              </p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {isTopAgent ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" /> {t('agents.top')}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <Building2 className="h-4 w-4" aria-hidden="true" /> {totalListings} {t('agent.activeListings')}
            </span>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <dt className="text-xs font-medium text-gray-500">{t('agent.sales')}</dt>
            <dd className="mt-1 text-lg font-bold text-gray-900">{a.totalSales ?? '—'}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <dt className="text-xs font-medium text-gray-500">{t('agent.deals')}</dt>
            <dd className="mt-1 text-lg font-bold text-gray-900">{a.totalDeals ?? '—'}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <dt className="text-xs font-medium text-gray-500">{t('agent.listings')}</dt>
            <dd className="mt-1 text-lg font-bold text-gray-900">{totalListings}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-surface p-6 text-center">
        <p className="text-sm font-medium text-gray-700">{t('agent.reviewsEmpty')}</p>
        <p className="mt-1 text-sm text-gray-500">{t('agent.reviewsEmptyDesc')}</p>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-2xl pb-10">
      <div className="mt-6 rounded-2xl border border-gray-200 bg-surface p-6">
        <h2 className="text-lg font-bold text-gray-900">{t('agent.about')}</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
          {a.bio || t('agent.noBio')}
        </p>
        <dl className="mt-5 space-y-3 border-t border-gray-100 pt-5">
          {a.agencyName ? (
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="font-medium text-gray-500">{t('agent.agency')}</dt>
              <dd className="flex items-center gap-1 font-semibold text-gray-900">
                <BadgeCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
                {a.agencyName}
              </dd>
            </div>
          ) : null}
          {a.licenseNumber ? (
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="font-medium text-gray-500">{t('agent.license')}</dt>
              <dd className="font-mono text-sm font-semibold text-gray-900">{a.licenseNumber}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="font-medium text-gray-500">{t('agent.agentCode')}</dt>
            <dd className="font-mono text-sm font-semibold text-gray-900">{a.agentCode}</dd>
          </div>
          {a.phone ? (
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="font-medium text-gray-500">{t('property.call')}</dt>
              <dd className="font-semibold text-gray-900">{a.phone}</dd>
            </div>
          ) : null}
          {a.email ? (
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="font-medium text-gray-500">{t('contact.email')}</dt>
              <dd className="font-semibold text-gray-900">{a.email}</dd>
            </div>
          ) : null}
          {a.province?.name ? (
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="font-medium text-gray-500">{t('search.province')}</dt>
              <dd className="flex items-center gap-1 font-semibold text-gray-900">
                <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" /> {a.province.name}
              </dd>
            </div>
          ) : null}
          {a.rating ? (
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="font-medium text-gray-500">{t('agent.rating')}</dt>
              <dd className="flex items-center gap-1 font-semibold text-gray-900">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                {a.rating.toFixed(1)} · {t('agent.reviewsCount', { count: (a.reviewsCount ?? 0).toLocaleString() })}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="font-medium text-gray-500">{t('common.currency')}</dt>
            <dd className="font-semibold text-gray-900">BIF / USD</dd>
          </div>
        </dl>
      </div>
    </div>
  );

  const tabs: Array<{ id: ChannelTab; label: string }> = [
    { id: 'home', label: t('agent.home') },
    { id: 'listings', label: t('agent.listings') },
    { id: 'sold', label: t('agent.sold') },
    { id: 'reviews', label: t('agent.reviews') },
    { id: 'about', label: t('agent.about') },
  ];

  return (
    <div className="pb-14">
      {/* ── 1. Cover banner (edge-to-edge) ─────────────────── */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-r from-brand-800 via-brand-600 to-brand-400 md:h-64">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-gray-950/10 to-transparent" aria-hidden="true" />
        <div className="absolute -left-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        {a.slogan ? (
          <p className="absolute bottom-4 right-4 hidden max-w-md text-right text-xs font-medium italic text-gray-200 md:block">
            “{a.slogan}”
          </p>
        ) : null}
      </div>

      <div className="container-page">
        {/* ── 2. Identity row (overlaps banner) ─────────────── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* Avatar + agency badge — only the avatar overlaps the banner */}
            <div className="relative -mt-14 shrink-0 md:-mt-16">
              {a.photoUrl ? (
                <img
                  src={a.photoUrl}
                  alt={`${a.firstName} ${a.lastName}`}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-bg md:h-28 md:w-28"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-ink text-3xl font-bold text-white ring-4 ring-bg md:h-28 md:w-28">
                  {initials(a)}
                </span>
              )}
              {a.agencyName ? (
                <span
                  title={a.agencyName}
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-bg bg-brand-600 text-xs font-bold text-white"
                >
                  {a.agencyName
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
              ) : null}
            </div>

            <div className="pb-1 pt-3 md:pt-5">
              {/* Name */}
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">
                {a.firstName} {a.lastName}
                {isTopAgent ? (
                  <BadgeCheck className="h-7 w-7 shrink-0 text-brand-600" aria-label={t('agents.top')} />
                ) : null}
              </h1>

              {/* Meta line: handle · rating (N) · active listings */}
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{handle}</span>
                <span aria-hidden="true">·</span>
                {a.rating ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    {a.rating.toFixed(1)} ({t('agent.reviewsCount', { count: (a.reviewsCount ?? 0).toLocaleString() })})
                  </span>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>
                  {totalListings} {t('agent.activeListings')}
                </span>
                {a.province?.name ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" aria-hidden="true" /> {a.province.name}
                    </span>
                  </>
                ) : null}
              </p>

              {/* Short bio with inline …more expander */}
              {a.bio ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
                  <span className={bioMore ? '' : 'line-clamp-2'}>{a.bio}</span>{' '}
                  <button
                    type="button"
                    onClick={() => setBioMore((v) => !v)}
                    className="font-medium text-brand-700 hover:underline"
                    aria-expanded={bioMore}
                  >
                    {bioMore ? `${t('common.close')}…` : `…${t('agent.more')}`}
                  </button>
                </p>
              ) : null}

              {/* Links row: primary link + "and N more links" */}
              {primaryLink ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <a
                    href={primaryLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> {primaryLink.label}
                  </a>
                  {extraLinks.length > 0 ? (
                    <>
                      <span className="text-gray-400">·</span>
                      <button
                        type="button"
                        onClick={() => setLinksOpen((v) => !v)}
                        className="font-medium text-gray-500 hover:text-gray-900"
                        aria-expanded={linksOpen}
                      >
                        {t('agent.moreLinks', { count: String(extraLinks.length) })}
                      </button>
                    </>
                  ) : null}
                  {linksOpen ? (
                    <span className="flex flex-wrap items-center gap-2">
                      {extraLinks.map((l) => (
                        <a
                          key={l.id}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-field px-3 py-1 text-xs font-medium text-gray-700 hover:border-gray-300"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden="true" /> {l.label}
                        </a>
                      ))}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Actions: primary CTA + secondary icon buttons */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:bg-gray-950 active:scale-[0.98]"
            >
              <User className="h-4 w-4" />
              {t('property.contactAgent')}
            </button>
            {a.phone ? (
              <a
                href={`tel:${a.phone}`}
                aria-label={`${t('property.call')} ${a.phone}`}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-surface text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Phone className="h-4 w-4" />
              </a>
            ) : null}
            {a.phone ? (
              <a
                href={waLink(a.phone, a.firstName)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('property.whatsapp')}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-surface text-gray-700 transition-colors hover:bg-gray-50"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            ) : null}
            {a.email ? (
              <a
                href={`mailto:${a.email}`}
                aria-label={t('contact.email')}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-surface text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Mail className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>

        {/* ── 3. Tab navigation ────────────────────────────── */}
        <div className="mt-8 flex items-center gap-6 border-b border-gray-200">
          <nav className="flex min-w-0 flex-1 gap-5 overflow-x-auto md:gap-8" aria-label={t('agent.about')}>
            {tabs.map((tItem) => {
              const active = tab === tItem.id;
              return (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setTab(tItem.id)}
                  className={`relative whitespace-nowrap pb-3 text-sm font-semibold transition-colors ${
                    active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tItem.label}
                  <span
                    className={`absolute inset-x-0 bottom-[-1px] h-[3px] rounded-t-full bg-brand-600 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>
          {/* Inline search for this agent's listings */}
          {tab !== 'reviews' && tab !== 'about' ? (
            <div className="flex shrink-0 items-center gap-2 pb-2.5">
              {searchOpen ? (
                <input
                  type="search"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPageSize(12);
                  }}
                  placeholder={t('agent.searchPlaceholder')}
                  className="input w-44 md:w-56"
                  autoFocus
                />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (searchOpen) {
                    setQ('');
                    setSearchOpen(false);
                  } else {
                    setSearchOpen(true);
                  }
                }}
                aria-label={t('agent.searchPlaceholder')}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  searchOpen ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          ) : null}
        </div>

        {/* ── 4. Content feed ──────────────────────────────── */}
        {tab === 'reviews' ? (
          renderReviews()
        ) : tab === 'about' ? (
          renderAbout()
        ) : (
          <div className="pb-10">
            {/* Channel header: heading + meta + chips */}
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  {t('agent.recent')} ·{' '}
                  <button
                    type="button"
                    onClick={() => setTab('listings')}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {totalListings}
                  </button>
                </p>
              </div>
              {tab === 'home' ? sortChips : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setListingType('')}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      listingType === '' ? 'bg-ink text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t('common.all')}
                  </button>
                  {LISTING_TYPE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setListingType(o.value as ListingType)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        listingType === o.value ? 'bg-ink text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t(o.labelKey)}
                    </button>
                  ))}
                </div>
              )}
              {tab === 'listings' || tab === 'sold' ? <div className="-mt-1">{sortChips}</div> : null}
            </div>
            {renderFeed()}
          </div>
        )}
      </div>

      {/* Contact modal */}
      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title={t('property.contactAgent')}>
        {hasContact ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {a.firstName} {a.lastName} · {a.agencyName ? <span className="font-medium text-gray-900">{a.agencyName}</span> : null}
            </p>
            {a.phone ? (
              <a href={`tel:${a.phone}`} className="btn-outline flex w-full items-center gap-2">
                <Phone className="h-4 w-4" /> {a.phone}
              </a>
            ) : null}
            {a.phone ? (
              <a href={waLink(a.phone, a.firstName)} target="_blank" rel="noopener noreferrer" className="btn-outline flex w-full items-center gap-2">
                <MessageCircle className="h-4 w-4" /> {t('property.whatsapp')}
              </a>
            ) : null}
            {a.email ? (
              <a href={`mailto:${a.email}`} className="btn-outline flex w-full items-center gap-2">
                <Mail className="h-4 w-4" /> {a.email}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-gray-600">{t('agent.emptyDesc')}</p>
        )}
      </Modal>
    </div>
  );
}