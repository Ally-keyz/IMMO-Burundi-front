import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Bookmark,
  Building2,
  Calendar,
  Camera,
  Car,
  Check,
  ChevronLeft,
  Flag,
  Layers,
  MoreVertical,
  MessageCircle,
  Ruler,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import type { PropertySummaryDTO } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi, reportsApi, favoritesApi, enquiriesApi, getApiErrorMessage } from '../lib/api';
import { invalidateRailCounts } from '../lib/railCounts';
import { defaultContactMessage } from '../lib/whatsapp';
import { useAsyncData } from '../lib/useAsyncData';
import PropertyGallery from '../components/PropertyGallery';
import VisitBookingModal from '../components/VisitBookingModal';
import VisitBookedSuccessModal from '../components/VisitBookedSuccessModal';
import ContactAgentModal from '../components/ContactAgentModal';
import FilterChips from '../components/FilterChips';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { formatCompact } from '../lib/format';
import { breadcrumbSchema, propertyListingSchema } from '../lib/seo/jsonld';
import { Seo, withGlobalJsonLd } from '../components/seo/Seo';
import PropertyMap from '../components/PropertyMap';

type RelatedFilter = 'ALL' | 'SIMILAR' | 'SAME_AGENT' | 'SAME_NEIGHBORHOOD' | 'VERIFIED';

const RELATED_CHIPS: Array<{ labelKey: string; value: RelatedFilter }> = [
  { labelKey: 'common.all', value: 'ALL' },
  { labelKey: 'property.similar', value: 'SIMILAR' },
  { labelKey: 'property.sameAgent', value: 'SAME_AGENT' },
  { labelKey: 'property.sameNeighborhood', value: 'SAME_NEIGHBORHOOD' },
  { labelKey: 'property.verified', value: 'VERIFIED' },
];

interface LocalComment {
  id: string;
  author: string;
  text: string;
  postedAt: string;
}

/** Lightweight relative-time helper — falls back to null when no date is available. */
function timeAgo(dateStr: string | null | undefined, t: (key: string, params?: Record<string, string | number>) => string): string | null {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(diffMs)) return null;
  const day = 86400000;
  if (diffMs < day) return t('rel.today');
  const days = Math.floor(diffMs / day);
  if (days < 7) return t('rel.daysAgo', { days });
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return t('rel.weeksAgo', { weeks });
  const months = Math.floor(days / 30);
  if (months < 12) return t('rel.monthsAgo', { months });
  return t('rel.yearsAgo', { years: Math.floor(days / 365) });
}

/* ── Sidebar row — styled like a YouTube "up next" suggestion ───── */
function RelatedRow({ property }: { property: PropertySummaryDTO }): JSX.Element {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const thumb = property.media?.[0]?.thumbUrl ?? property.media?.[0]?.url;
  const location = [property.location?.commune?.name, property.location?.province?.name].filter(Boolean).join(', ');
  const status = property.verification?.status ?? 'NOT_VERIFIED';
  const verified = status === 'VERIFIED' || status === 'FULLY_VERIFIED';
  const posted = timeAgo((property as unknown as { createdAt?: string }).createdAt, t);

  return (
    <button
      type="button"
      onClick={() => navigate(`/property/${property._id}`)}
      className="group flex w-full gap-2 rounded-xl p-1.5 text-left transition-colors hover:bg-gray-100"
    >
      <span className="relative h-[94px] w-[168px] shrink-0 overflow-hidden rounded-xl bg-gray-200">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300">
            <Building2 className="h-6 w-6 text-brand-600/50" />
          </span>
        )}
        {property.badges?.isNew ? (
          <span className="absolute left-1.5 top-1.5 rounded bg-red-600 px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide text-white">
            {t('property.isNew')}
          </span>
        ) : null}
        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {formatPrice(property.price.amount, property.price.currency)}
        </span>
      </span>
      <span className="min-w-0 flex-1 py-0.5">
        <span className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">{property.title}</span>
        <span className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          {property.agent ? `${property.agent.firstName} ${property.agent.lastName}` : location || t('common.na')}
          {verified ? <BadgeCheck className="h-3 w-3 shrink-0 text-gray-500" /> : null}
        </span>
        <span className="mt-0.5 block text-xs text-gray-500">
          {formatCompact(property.stats?.views ?? 0)} {t('property.views')}
          {posted ? ` · ${posted}` : ''}
        </span>
      </span>
    </button>
  );
}

export default function PropertyDetailPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { formatPrice, formatPriceWithOriginal } = useCurrency();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const detail = useAsyncData(() => propertiesApi.getOne(id), [id]);
  const related = useAsyncData(() => propertiesApi.getRelated(id, 12), [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [id]);

  const [relatedFilter, setRelatedFilter] = useState<RelatedFilter>('ALL');
  const [isFavorite, setIsFavorite] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buySending, setBuySending] = useState(false);
  const [buyFeedback, setBuyFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactNote, setContactNote] = useState<string | undefined>(undefined);
  const [bookedRef, setBookedRef] = useState<string | null>(null);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');

  const property = detail.data;

  const filteredRelated = useMemo(() => {
    const list = related.data ?? [];
    if (!property) return list;
    switch (relatedFilter) {
      case 'SAME_AGENT':
        return list.filter((p) => property.agent?.id && p.agent?.id === property.agent.id);
      case 'SAME_NEIGHBORHOOD':
        return list.filter((p) => p.location?.commune?._id && p.location.commune._id === property.location?.commune?._id);
      case 'VERIFIED':
        return list.filter((p) => p.verification?.status === 'VERIFIED' || p.verification?.status === 'FULLY_VERIFIED');
      case 'SIMILAR':
      case 'ALL':
      default:
        return list;
    }
  }, [related.data, relatedFilter, property]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      if (next) await favoritesApi.add(id);
      else await favoritesApi.remove(id);
      invalidateRailCounts();
    } catch {
      setIsFavorite(!next);
    }
  };

  const toggleLike = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }
    setLiked((v) => !v);
    if (disliked) setDisliked(false);
  };

  const toggleDislike = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }
    setDisliked((v) => !v);
    if (liked) setLiked(false);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title ?? 'IMMO BURUNDI', url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback(t('common.copy'));
        setTimeout(() => setShareFeedback(null), 2500);
      }
    } catch {
      /* user cancelled share */
    }
  };

  const askAgent = () => {
    document.getElementById('qa-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('qa-input')?.focus();
  };

  /** Opens the direct agent contact dialog (phone number + WhatsApp chat). */
  const openContactAgent = (note?: string) => {
    setContactNote(note);
    setContactOpen(true);
  };

  const handleVisitPlaced = (reference: string) => {
    setVisitOpen(false);
    setBookedRef(reference);
    /* Badge on the "My visits" rail item must increment immediately. */
    invalidateRailCounts();
  };

  const submitComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = commentDraft.trim();
    if (!text) return;
    setComments((prev) => [{ id: `${Date.now()}`, author: t('common.you'), text, postedAt: t('common.now') }, ...prev]);
    setCommentDraft('');
  };

  const submitReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!property) return;
    const fd = new FormData(e.currentTarget);
    try {
      await reportsApi.create({
        resourceType: 'Property',
        resourceId: property._id,
        reason: String(fd.get('reason')),
        description: String(fd.get('description') ?? ''),
      });
      setReportFeedback(t('property.reportSuccess'));
      setTimeout(() => setReportOpen(false), 1500);
    } catch (err) {
      setReportFeedback(getApiErrorMessage(err));
    }
  };

  const openBuy = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }
    setBuyFeedback(null);
    setBuyOpen(true);
  };

  const submitBuy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!property) return;
    const fd = new FormData(e.currentTarget);
    /* The message is optional for the user, but the API requires a non-empty body. */
    const message = String(fd.get('message') ?? '').trim() || defaultContactMessage(property.title, language);
    setBuySending(true);
    setBuyFeedback(null);
    try {
      await enquiriesApi.create({
        propertyId: property._id,
        agentId: property.agent?.id,
        subject: `BUY_INTENT ${property.title}`,
        message,
        preferredContact: 'EMAIL',
      });
      setBuyOpen(false);
      /* A buy request counts as an application — bump the "My applications" badge. */
      invalidateRailCounts();
      /* Request sent — hand the user straight to the agent's number / WhatsApp. */
      openContactAgent(t('contact.buyRequested'));
    } catch (err) {
      setBuyFeedback({ ok: false, text: getApiErrorMessage(err) });
    } finally {
      setBuySending(false);
    }
  };

  /* ── Loading ─────────────────────────────────────── */
  if (detail.loading) {
    return (
      <div className="container-page py-6">
        <Seo
          title="Propriété"
          description="Chargement de la fiche immobilière sur IMMO BURUNDI."
          path={`/property/${id}`}
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="aspect-video animate-pulse rounded-xl bg-gray-200" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-14 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="h-[94px] w-[168px] shrink-0 animate-pulse rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error / not found ───────────────────────────── */
  if (detail.error || !property) {
    return (
      <div className="container-page py-16">
        <Seo
          title="Propriété introuvable"
          description="Cette propriété n'est plus disponible sur IMMO BURUNDI."
          path={`/property/${id}`}
          noindex
        />
        <ErrorState
          title={t('property.notFound')}
          message={detail.error ?? t('error.propertyLoadFail')}
          onRetry={detail.reload}
          retryLabel={t('error.retry')}
        />
      </div>
    );
  }

  const precision = property.location?.locationPrecision ?? 'APPROXIMATE';
  const lat = property.location?.latitude;
  const lng = property.location?.longitude;
  const photoCount = property.media?.length ?? 0;

  const specs: Array<{ icon: JSX.Element; label: string; value: string }> = [
    { icon: <Ruler className="h-3.5 w-3.5" />, label: t('property.surface'), value: `${property.features?.surfaceArea ?? '—'}` },
    { icon: <BedDouble className="h-3.5 w-3.5" />, label: t('property.bedrooms'), value: `${property.features?.bedrooms ?? '—'}` },
    { icon: <Bath className="h-3.5 w-3.5" />, label: t('property.bathrooms'), value: `${property.features?.bathrooms ?? '—'}` },
    { icon: <Layers className="h-3.5 w-3.5" />, label: t('property.floors'), value: `${property.features?.floors ?? '—'}` },
    { icon: <Car className="h-3.5 w-3.5" />, label: t('property.parking'), value: `${property.features?.parkingSpaces ?? '—'}` },
    { icon: <Calendar className="h-3.5 w-3.5" />, label: t('property.yearBuilt'), value: `${property.features?.yearBuilt ?? '—'}` },
    { icon: <Building2 className="h-3.5 w-3.5" />, label: t('propertyType.apartment'), value: t(`propertyType.${property.propertyType}`) },
  ];

  const showMap = precision !== 'HIDDEN' && typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng);

  /* ── SEO ─────────────────────────────────────────── */
  const communeName = property.location?.commune?.name ?? '';
  const provinceName = property.location?.province?.name ?? '';
  const isRental = property.listingType === 'RENT' || property.listingType === 'LEASE';
  const listingWord = isRental ? 'à louer' : 'à vendre';
  const placeLabel = [communeName, provinceName].filter(Boolean).join(', ');
  const priceLabel = `${property.price.amount} ${property.price.currency}`;
  const primaryImage =
    property.media?.find((m) => m.isPrimary) ?? (property.media?.length ? property.media[0] : undefined);
  const socialImage = primaryImage?.url ?? primaryImage?.thumbUrl;

  const seoDescriptionParts = [
    `${property.title} ${listingWord}${placeLabel ? ` à ${placeLabel}` : ''} au Burundi.`,
    property.features?.surfaceArea ? `${property.features.surfaceArea} m²` : null,
    property.features?.bedrooms
      ? `${property.features.bedrooms} chambre${property.features.bedrooms > 1 ? 's' : ''}`
      : null,
    `Prix : ${priceLabel}.`,
    property.propertyId ? `Réf. ${property.propertyId}.` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="container-page py-4 lg:py-6">
      <Seo
        type="product"
        title={`${property.title}${communeName ? ` à ${communeName}` : ''} ${listingWord}`}
        description={seoDescriptionParts.join(' ')}
        path={`/property/${property._id || property.id}`}
        image={socialImage}
        keywords={[property.title, placeLabel, property.propertyType, listingWord, 'Burundi']
          .filter(Boolean)
          .join(', ')}
        jsonLd={withGlobalJsonLd([
          propertyListingSchema(property),
          breadcrumbSchema([
            { name: 'Accueil', path: '/' },
            { name: isRental ? 'Louer' : 'Acheter', path: isRental ? '/rent' : '/buy' },
            { name: property.title, path: `/property/${property._id || property.id}` },
          ]),
        ])}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_402px]">
        {/* ══ LEFT COLUMN — the "player" ══ */}
        <div className="min-w-0 space-y-4">
          {/* Photo player */}
          <div className="relative overflow-hidden rounded-xl bg-black">
            {/* Back arrow — on top of the image, top-left corner */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t('common.back')}
              className="absolute left-0 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="aspect-video">
              <PropertyGallery images={property.media ?? []} title={property.title} />
            </div>
            {photoCount > 0 ? (
              <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/75 px-2 py-1 text-xs font-medium text-white">
                <Camera className="h-3.5 w-3.5" />
                {photoCount} {t('property.photos')}
              </span>
            ) : null}
          </div>

          {/* Title + highlighted price */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 text-xl font-semibold leading-snug text-gray-900">{property.title}</h1>
            <p className="shrink-0 rounded-xl bg-accent px-4 py-2 text-xl font-extrabold leading-tight tracking-tight text-ink">
              {formatPriceWithOriginal(property.price.amount, property.price.currency)}
            </p>
          </div>

          {/* Channel row: agent + subscribe-like CTA, and action buttons */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              {property.agent?.photoUrl ? (
                <img
                  src={property.agent.photoUrl}
                  alt={`${property.agent.firstName} ${property.agent.lastName}`}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
                  {property.agent?.firstName?.[0] ?? 'A'}
                </span>
              )}
              <div>
                <p className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                  {property.agent ? (
                    <Link to={`/agent/${property.agent.id}`} className="hover:underline">
                      {property.agent.firstName} {property.agent.lastName}
                    </Link>
                  ) : (
                    t('property.agentCard')
                  )}
                  {property.agent?.topAgent ? <BadgeCheck className="h-4 w-4 text-brand-600" /> : null}
                </p>
                <p className="text-xs text-gray-500">
                  {property.agent?.agencyName ?? t('property.propertyId')} · {formatCompact(property.stats?.views ?? 0)} {t('property.views')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openContactAgent()}
                className="ml-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-gray-950"
              >
                {t('property.contactAgent')}
              </button>
              <button
                type="button"
                onClick={() => setVisitOpen(true)}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent-strong"
              >
                {t('visit.bookVisit')}
              </button>
              {property.listingType === 'SALE' ? (
                <button
                  type="button"
                  onClick={openBuy}
                  className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  {t('property.buy')}
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-full bg-gray-100">
                <button
                  type="button"
                  onClick={toggleLike}
                  aria-pressed={liked}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium hover:bg-gray-200 ${liked ? 'text-brand-700' : 'text-gray-800'}`}
                >
                  <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-brand-600 text-brand-600' : ''}`} />
                  {formatCompact((property.stats?.views ?? 0) > 0 ? Math.max(1, Math.round((property.stats?.views ?? 0) * 0.04)) + (liked ? 1 : 0) : liked ? 1 : 0)}
                </button>
                <span className="h-5 w-px bg-gray-300" />
                <button
                  type="button"
                  onClick={toggleDislike}
                  aria-pressed={disliked}
                  className="flex items-center px-3 py-2 hover:bg-gray-200"
                >
                  <ThumbsDown className={`h-4 w-4 ${disliked ? 'fill-gray-700 text-gray-700' : 'text-gray-800'}`} />
                </button>
              </div>

              <button type="button" onClick={share} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200">
                <Share2 className="h-4 w-4" />
                {t('property.share')}
              </button>

              <button type="button" onClick={askAgent} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200">
                <Sparkles className="h-4 w-4" />
                {t('property.ask')}
              </button>

              <button
                type="button"
                onClick={toggleFavorite}
                aria-pressed={isFavorite}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium hover:bg-gray-200 ${isFavorite ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-800'}`}
              >
                <Bookmark className={`h-4 w-4 ${isFavorite ? 'fill-brand-600 text-brand-600' : ''}`} />
                {t('property.favorites')}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-label={t('common.more')}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {moreOpen ? (
                  <>
                    <button type="button" aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setMoreOpen(false)} />
                    <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl bg-surface py-1 shadow-lg ring-1 ring-black/5">
                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          isAuthenticated ? setReportOpen(true) : navigate('/login');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Flag className="h-4 w-4" />
                        {t('property.report')}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          {shareFeedback ? <p className="text-sm text-verified">{shareFeedback}</p> : null}

          {/* Description */}
          <section aria-label={t('property.aboutThis')}>
            <h2 className="mb-2 text-base font-semibold text-gray-900">{t('property.aboutThis')}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {property.description || t('empty.noPropertiesDesc')}
            </p>

            {/* Property breakdown — size, bedrooms, … */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {specs.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-2 text-xs text-gray-700"
                >
                  <span className="text-accent">{s.icon}</span>
                  <span className="font-semibold text-gray-900">{s.value}</span>
                  <span className="truncate">{s.label}</span>
                </span>
              ))}
            </div>
          </section>

          {/* Map */}
          <section aria-label={t('property.map')}>
            <h2 className="mb-2 text-base font-semibold text-gray-900">{t('property.map')}</h2>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              {!showMap ? (
                <div className="flex h-64 items-center justify-center bg-gray-50 text-center text-sm text-gray-400">
                  <span className="max-w-xs px-6">
                    <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" aria-hidden="true" />
                    {precision === 'HIDDEN' ? t('map.locationHidden') : t('map.approximateLocation')}
                  </span>
                </div>
              ) : (
                <PropertyMap
                  latitude={lat as number}
                  longitude={lng as number}
                  precision={precision}
                  title={property.title}
                  className="h-64"
                />
              )}
            </div>
          </section>

          {/* Comments-style Q&A */}
          <section id="qa-section" className="pt-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {comments.length} {t('property.questions')}
            </h2>

            <form onSubmit={submitComment} className="mt-4 flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {t('common.you')?.[0] ?? 'Y'}
              </span>
              <div className="flex-1 border-b border-gray-300 focus-within:border-gray-800">
                <input
                  id="qa-input"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={t('property.askPlaceholder')}
                  className="w-full bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>
              {commentDraft.trim() ? (
                <button type="submit" className="mt-1 rounded-full bg-brand-600 p-2 text-white hover:bg-brand-700">
                  <Send className="h-4 w-4" />
                </button>
              ) : null}
            </form>

            <div className="mt-6 space-y-5">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500">{t('property.noQuestionsYet')}</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                      {c.author[0]}
                    </span>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">{c.author}</span>{' '}
                        <span className="text-xs text-gray-400">{c.postedAt}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-gray-700">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* ══ RIGHT COLUMN — the "up next" rail ══ */}
        <aside className="min-w-0 space-y-4">
          <FilterChips
            chips={RELATED_CHIPS.map((c) => ({ label: t(c.labelKey), value: c.value }))}
            activeValue={relatedFilter}
            onSelect={(v) => setRelatedFilter(v as RelatedFilter)}
          />

          <div className="space-y-1">
            {related.loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2 p-1.5">
                  <div className="h-[94px] w-[168px] shrink-0 animate-pulse rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-50" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-50" />
                  </div>
                </div>
              ))
            ) : related.error ? (
              <ErrorState title={t('error.loadFailed')} message={related.error} onRetry={related.reload} retryLabel={t('error.retry')} />
            ) : filteredRelated.length > 0 ? (
              filteredRelated.map((p) => <RelatedRow key={p._id} property={p} />)
            ) : (
              <EmptyState title={t('property.noRelated')} icon={<Building2 className="h-8 w-8" />} />
            )}
          </div>

          {/* Agent promo card */}
          {property.agent ? (
            <section className="card p-6 text-center" aria-label={t('property.agentCard')}>
              {property.agent.photoUrl ? (
                <img
                  src={property.agent.photoUrl}
                  alt={`${property.agent.firstName} ${property.agent.lastName}`}
                  className="mx-auto h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
                  {property.agent.firstName?.[0] ?? 'A'}
                </span>
              )}
              <h3 className="mt-3 text-base font-bold text-gray-900">
                {property.agent.firstName} {property.agent.lastName}
              </h3>
              {property.agent.agencyName ? <p className="text-sm text-gray-500">{property.agent.agencyName}</p> : null}
              <div className="mt-2 flex items-center justify-center gap-3 text-sm">
                {typeof property.agent.rating === 'number' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    {property.agent.rating.toFixed(1)}
                  </span>
                ) : null}
                {property.agent.topAgent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('property.topAgent')}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-gray-400">{t('property.propertyId')}: {property.agent.agentCode}</p>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" onClick={() => openContactAgent()} className="btn-primary w-full">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {t('property.contactAgent')}
                </button>
                <Link to={`/agent/${property.agent.id}`} className="btn-outline w-full">
                  {t('property.viewProfile')}
                </Link>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('property.reportTitle')} size="sm">
        <form onSubmit={submitReport} className="space-y-4">
          <div>
            <label htmlFor="report-reason" className="label">{t('property.report')}</label>
            <select id="report-reason" name="reason" required className="input">
              {[
                'WRONG_INFORMATION',
                'FRAUD_SUSPICION',
                'INCORRECT_PRICE',
                'DUPLICATE_LISTING',
                'WRONG_LOCATION',
                'INAPPROPRIATE_CONTENT',
                'ALREADY_SOLD_OR_RENTED',
                'OTHER',
              ].map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="report-desc" className="label">{t('contact.message')}</label>
            <textarea id="report-desc" name="description" rows={4} className="input" />
          </div>
          {reportFeedback ? (
            <p role="alert" className="rounded-xl bg-verified/10 p-3 text-sm text-verified">{reportFeedback}</p>
          ) : null}
          <button type="submit" className="btn-primary w-full">{t('common.submit')}</button>
        </form>
      </Modal>

      {/* Buy intent modal */}
      <Modal open={buyOpen} onClose={() => setBuyOpen(false)} title={t('modal.buy.title')} size="sm">
        <form onSubmit={submitBuy} className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{property.title}</span>
            {' · '}
            {formatPriceWithOriginal(property.price.amount, property.price.currency)}
          </p>
          <div>
            <label htmlFor="buy-message" className="label">{t('contact.message')}</label>
            <textarea id="buy-message" name="message" rows={4} className="input" placeholder={t('property.buyHint')} />
            <p className="mt-1 text-xs text-gray-500">{t('modal.buy.optionalMessage')}</p>
          </div>
          {buyFeedback ? (
            <p
              role="alert"
              className={`rounded-xl p-3 text-sm ${buyFeedback.ok ? 'bg-verified/10 text-verified' : 'bg-error/10 text-error'}`}
            >
              {buyFeedback.text}
            </p>
          ) : null}
          <button type="submit" disabled={buySending} className="btn-primary w-full">
            {buySending ? t('common.loading') : t('property.buy')}
          </button>
        </form>
      </Modal>

      {/* Book visit bottom sheet */}
      <VisitBookingModal open={visitOpen} propertyId={property._id} media={property.media} onClose={() => setVisitOpen(false)} onPlaced={handleVisitPlaced} />

      {/* Visit placed success modal */}
      <VisitBookedSuccessModal
        open={Boolean(bookedRef)}
        reference={bookedRef ?? ''}
        agent={property.agent}
        propertyTitle={property.title}
        onClose={() => setBookedRef(null)}
      />

      {/* Direct agent contact — number + WhatsApp chat */}
      <ContactAgentModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        agent={property.agent}
        propertyTitle={property.title}
        note={contactNote}
      />
    </div>
  );
}