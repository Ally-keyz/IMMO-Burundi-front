import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Building2, Eye, Heart, MoreHorizontal, ThumbsUp } from 'lucide-react';
import type { PropertySummaryDTO } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { favoritesApi } from '../lib/api';
import { formatCompact } from '../lib/format';

interface PropertyCardProps {
  property: PropertySummaryDTO;
  onFavoriteChange?: (propertyId: string, isFavorite: boolean) => void;
  favorite?: boolean;
  onOpenDetail?: (property: PropertySummaryDTO) => void;
}

export default function PropertyCard({ property, onFavoriteChange, favorite: favoriteProp = false, onOpenDetail }: PropertyCardProps): JSX.Element {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(favoriteProp);
  const [imgFailed, setImgFailed] = useState(false);

  const primaryMedia = property.media?.find((m) => m.isPrimary) ?? property.media?.[0];
  const imageUrl = primaryMedia?.url;

  const toggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!isAuthenticated) {
        navigate('/login', { state: { from: `/property/${property._id}` } });
        return;
      }
      const next = !isFavorite;
      setIsFavorite(next);
      onFavoriteChange?.(property._id, next);
      try {
        if (next) {
          await favoritesApi.add(property._id);
        } else {
          await favoritesApi.remove(property._id);
        }
      } catch {
        setIsFavorite(!next);
      }
    },
    [isAuthenticated, isFavorite, navigate, onFavoriteChange, property._id],
  );

  const agentName = property.agent
    ? `${property.agent.firstName} ${property.agent.lastName}`.trim() || property.agent.agencyName || ''
    : '';

  const location = [property.location?.province?.name, property.location?.commune?.name].filter(Boolean).join(', ');
  const saves = property.stats?.favorites ?? 0;
  const views = property.stats?.views ?? 0;

  const openDetail = () => {
    if (onOpenDetail) {
      onOpenDetail(property);
      return;
    }
    navigate(`/property/${property._id}`);
  };

  return (
    <article
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      }}
      role="link"
      tabIndex={0}
      className="group cursor-pointer outline-none"
      aria-label={property.title}
    >
      {/* ── Cover image ─────────────────────────────────────── */}
      <div className="relative aspect-[438/342] overflow-hidden rounded-tile bg-gray-100">
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={property.title}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300">
            <Building2 className="h-12 w-12 text-brand-600/40" aria-hidden="true" />
          </div>
        )}

        {/* Hover dim */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" aria-hidden="true" />

        {/* Single verified badge — yellow icon, bottom-left of the image */}
        {property.verification?.status === 'VERIFIED' || property.verification?.status === 'FULLY_VERIFIED' ? (
          <span
            title={t('property.verified')}
            className="absolute bottom-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5B400] shadow-soft"
          >
            <BadgeCheck className="h-[18px] w-[18px] text-white" aria-hidden="true" />
          </span>
        ) : null}

        {/* Hover overlay controls (top-right, 12px from edges, 40px circles) */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <div className="flex items-center gap-2 opacity-100 sm:translate-x-1 sm:opacity-0 sm:transition-all sm:duration-150 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              aria-label="More options"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-gray-800 shadow-soft backdrop-blur transition-colors hover:bg-surface"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-700" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleFavorite}
              aria-label={isFavorite ? t('property.removed') : t('property.saved')}
              aria-pressed={isFavorite}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 shadow-soft backdrop-blur transition-transform hover:scale-105"
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? 'fill-notVerified text-notVerified' : 'text-gray-800'}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Author / stats row — 8px under the image ─────────────── */}
      <div className="mt-2 flex h-[50px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {property.agent ? (
            <Link
              to={`/agent/${property.agent.id}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="flex min-w-0 items-center gap-3"
              aria-label={`${property.agent.firstName} ${property.agent.lastName}`}
            >
              {property.agent.photoUrl ? (
                <img
                  src={property.agent.photoUrl}
                  alt=""
                  loading="lazy"
                  className="h-[30px] w-[30px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {property.agent.firstName?.[0] ?? <Building2 className="h-4 w-4" />}
                </span>
              )}
              <span className={`truncate text-card-agent font-bold ${property.agent ? 'text-gray-900 group-hover:text-gray-950' : 'text-gray-400'}`}>
                {agentName || 'IMMO BURUNDI'}
              </span>
            </Link>
          ) : (
            <span className={`truncate text-card-agent font-bold text-gray-400`}>IMMO BURUNDI</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-5 text-secondary">
          <span className="flex items-center gap-2 text-card-stats font-medium" title={t('property.saves')}>
            <ThumbsUp className="h-[22px] w-[22px] text-gray-900" aria-hidden="true" />
            {formatCompact(saves)}
          </span>
          <span className="flex items-center gap-2 text-card-stats font-medium" title={t('property.views')}>
            <Eye className="h-[22px] w-[22px] text-gray-900" aria-hidden="true" />
            {formatCompact(views)}
          </span>
        </div>
      </div>

      {/* ── Details lines — 4px spacing, 20/18/16/20 ────────── */}
      <div className="mt-1">
        <h3 className="truncate text-card-title font-bold text-gray-900 group-hover:underline group-hover:decoration-gray-300 group-hover:underline-offset-2">
          {property.title}
        </h3>
        <p className="mt-1 truncate text-card-loc text-secondary">{location || t('common.na')}</p>
        <p className="mt-1 text-card-price font-bold text-gray-900">{formatPrice(property.price.amount, property.price.currency)}</p>
      </div>
    </article>
  );
}