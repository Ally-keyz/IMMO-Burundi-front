import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpDown, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SORT_OPTIONS } from '../../lib/constants';
import type { SortValue } from '../../lib/constants';

export type ToolbarSegment = 'properties' | 'agents' | 'more';

interface ExploreToolbarProps {
  initialQuery?: string;
  initialSegment?: ToolbarSegment;
  sort?: string;
  onSortChange?: (sort: string) => void;
  onSearch?: (query: string, segment: ToolbarSegment, sort: string) => void;
  onFilterClick?: () => void;
  filterBadgeCount?: number;
  className?: string;
  /** White pill over the hero image: no borders, black round submit button at the end. */
  hero?: boolean;
}

/** Behance-style Explore toolbar row: 66px Filter pill + wide round search + sort. */
export default function ExploreToolbar({
  initialQuery = '',
  initialSegment = 'properties',
  sort = 'newest',
  onSortChange,
  onSearch,
  onFilterClick,
  filterBadgeCount = 0,
  className = '',
  hero = false,
}: ExploreToolbarProps): JSX.Element {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [segment, setSegment] = useState<ToolbarSegment>(initialSegment);
  const [sortOpen, setSortOpen] = useState(false);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const segments: Array<{ id: ToolbarSegment; label: string }> = [
    { id: 'properties', label: t('search.segment.properties') },
    { id: 'agents', label: t('search.segment.agents') },
    { id: 'more', label: t('search.segment.more') },
  ];
  const activeSegment = segments.find((s) => s.id === segment) ?? segments[0];
  const activeSort = SORT_OPTIONS.find((s) => s.value === sort) ?? SORT_OPTIONS[0];

  const submit = () => onSearch?.(query.trim(), segment, sort);
  const focusSearch = () => searchRef.current?.focus();

  return (
    <div className={hero ? 'rounded-full bg-surface p-1.5 shadow-pop ring-1 ring-black/5 md:p-2' : className}>
      <div className="flex items-center gap-2.5 sm:gap-3 desktop:gap-4">
        {/* Filter pill — 48px tall, 136px wide (desktop) */}
        <button
          type="button"
          onClick={onFilterClick}
          className={`relative inline-flex h-10 shrink-0 items-center justify-center gap-3 rounded-full text-ui font-medium text-gray-900 transition-all duration-200 hover:bg-gray-100 md:h-11 desktop:h-12 ${
            hero ? 'w-10 px-0 md:w-11 desktop:w-auto desktop:px-5' : 'w-24 border border-gray-200 bg-surface hover:border-gray-300 hover:bg-gray-50 md:w-[120px] desktop:w-[136px]'
          }`}
        >
          <SlidersHorizontal className="h-[22px] w-[22px] desktop:h-6 desktop:w-6" aria-hidden="true" />
          {t('common.filters')}
          {filterBadgeCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-ink">
              {filterBadgeCount}
            </span>
          ) : null}
        </button>

        {/* Main search field — 48px, fully rounded, #F7F7F7 */}
        <div
          className={`flex h-10 min-w-0 flex-1 items-center gap-3 rounded-full py-0 pr-2 text-gray-900 transition-all duration-200 focus-within:ring-4 focus-within:ring-brand-500/15 ${
            hero
              ? 'border-transparent bg-transparent pl-3 focus-within:ring-0 md:h-11 desktop:h-12'
              : 'border border-gray-200 bg-field pl-6 focus-within:border-gray-300 focus-within:bg-surface md:h-11 desktop:h-12'
          }`}
        >
          {!hero ? (
            <button
              type="button"
              onClick={submit}
              aria-label={t('common.search')}
              className="shrink-0 rounded-full p-1 text-gray-500 transition-colors hover:text-gray-900"
            >
              <Search className="h-[22px] w-[22px] desktop:h-6 desktop:w-6" aria-hidden="true" />
            </button>
          ) : null}
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder={t('search.placeholderShort')}
            aria-label={t('common.search')}
            className="min-w-0 flex-1 bg-transparent font-medium text-gray-900 outline-none placeholder:font-medium placeholder:text-placeholder"
            style={{ fontSize: 'var(--fs-search)', lineHeight: '1.3' }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}

          {/* Segmented scope toggle (inside the field, right — 36px white pill) */}
          <div className="relative hidden shrink-0 sm:block">
            <div className="flex items-center gap-0.5">
              {segments.map((seg) => {
                const isActive = seg.id === segment;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => {
                      setSegment(seg.id);
                      focusSearch();
                    }}
                    aria-pressed={isActive}
                    className={`flex h-7 items-center justify-center whitespace-nowrap rounded-full text-ui font-medium transition-all duration-200 md:h-8 desktop:h-9 ${
                      isActive
                        ? 'border border-gray-200 bg-surface px-5 text-gray-900 shadow-soft'
                        : 'border border-transparent px-4 text-placeholder hover:bg-surface/60 hover:text-gray-900'
                    }`}
                  >
                    {seg.label}
                    {seg.id === 'more' ? <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile segment dropdown */}
          <div className="relative shrink-0 sm:hidden">
            <button
              type="button"
              onClick={() => setSegmentOpen((v) => !v)}
              aria-expanded={segmentOpen}
              className="flex h-7 items-center gap-0.5 rounded-full border border-gray-200 bg-surface px-2.5 py-1 text-xs font-medium text-gray-800"
            >
              {activeSegment.label}
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
            </button>
            {segmentOpen ? (
              <div className="absolute right-0 top-full z-30 mt-2 w-40 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-pop">
                {segments.map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => {
                      setSegment(seg.id);
                      setSegmentOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-base transition-colors ${
                      seg.id === segment ? 'bg-brand-50 font-semibold text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {seg.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Hero submit — round black button with white arrow */}
          {hero ? (
            <button
              type="button"
              onClick={submit}
              aria-label={t('common.search')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-all duration-200 hover:scale-105 hover:bg-gray-950 md:h-11 md:w-11 desktop:h-12 desktop:w-12"
            >
              <ArrowRight className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* Sort button — 24px icon */}
        {!hero ? (
          <div className="relative ml-5 shrink-0 desktop:ml-6">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            aria-expanded={sortOpen}
            aria-label={t('search.sortBy')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 desktop:h-9 desktop:w-9"
          >
            <ArrowUpDown className="h-5 w-5 desktop:h-6 desktop:w-6" aria-hidden="true" />
          </button>
          {sortOpen ? (
            <div className="absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-pop">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{t('search.sortBy')}</p>
              {SORT_OPTIONS.map((opt) => {
                const isActive = opt.value === sort;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (onSortChange) onSortChange(opt.value as SortValue);
                      else submit();
                      setSortOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-base transition-colors ${
                      isActive ? 'bg-brand-50 font-semibold text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t(opt.labelKey)}
                    {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
          </div>
          ) : null}
        </div>
      </div>
  );
}