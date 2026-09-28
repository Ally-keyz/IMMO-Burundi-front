import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CategoryTile {
  id: string;
  label: string;
  icon?: JSX.Element;
  /** Decorative background photo (always `alt=""`, lazy). */
  imageUrl?: string;
  /** Icon-tile overlay kind: accent / near-black / navy. Defaults to photo+gradient. */
  hero?: 'accent' | 'ink' | 'navy';
  onClick: () => void;
}

interface CategoryTilesProps {
  tiles: CategoryTile[];
  activeId?: string;
  className?: string;
  ariaLabel?: string;
}

const OVERLAY: Record<NonNullable<CategoryTile['hero']>, string> = {
  accent: 'rgba(27,95,255,0.85)',
  ink: 'rgba(17,17,17,0.85)',
  navy: 'rgba(4,21,29,0.9)',
};

/**
 * Behance-style category tile row: 66px tall tiles (desktop), radius 8px,
 * every tile photo-backed with a dark overlay; icon tiles get tinted overlays.
 * Scrolls horizontally with a floating chevron.
 */
export default function CategoryTiles({ tiles, activeId, className = '', ariaLabel }: CategoryTilesProps): JSX.Element {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScroll(el.scrollWidth > el.clientWidth + 8);
    setScrollPos(el.scrollLeft);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, tiles]);

  const scrollBy = (dx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: 'smooth' });
  };

  const atStart = scrollPos <= 4;

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollerRef}
        role="listbox"
        aria-label={ariaLabel}
        onScroll={measure}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto desktop:gap-[12px]"
      >
        {tiles.map((tile, i) => {
          const isActive = activeId != null && tile.id === activeId;
          const kind = tile.hero ?? 'photo';
          return (
            <button
              key={tile.id}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={tile.onClick}
              className={`group relative flex h-10 min-w-[155px] shrink-0 snap-start items-center justify-center overflow-hidden rounded-tile px-10 text-ui font-bold text-white transition-colors duration-200 focus-visible:outline-none md:h-11 desktop:h-12 ${
                kind === 'accent' ? 'bg-tileaccent' : kind === 'navy' ? 'bg-tilenavy' : kind === 'ink' ? 'bg-gray-950' : 'bg-gray-200'
              }`}
              style={kind === 'photo' ? { maxWidth: 300 } : undefined}
            >
              {tile.imageUrl ? (
                <img
                  src={tile.imageUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.05]"
                />
              ) : (
                <span
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 14px)',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Overlay */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 transition-opacity duration-200 group-hover:opacity-85 ${
                  kind === 'photo' ? 'bg-gradient-to-b from-black/45 to-black/60' : ''
                }`}
                style={kind !== 'photo' ? { backgroundColor: OVERLAY[kind] } : undefined}
              />

              {/* Label row */}
              <span className="relative z-10 flex items-center gap-3" style={kind === 'photo' ? { maxWidth: 300 } : undefined}>
                {tile.icon ? <span className="shrink-0">{tile.icon}</span> : null}
                <span className="whitespace-nowrap">{tile.label}</span>
              </span>

              {/* Active / focus outline: 2px accent + 2px white offset */}
              {isActive ? (
                <span className="pointer-events-none absolute inset-0 rounded-tile ring-2 ring-accent ring-offset-2" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Right fade + floating chevron */}
      {canScroll ? (
        <>
          {!atStart ? (
            <>
              <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
              <button
                type="button"
                onClick={() => scrollBy(-300)}
                aria-label="Scroll categories left"
                className="absolute -left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-gray-700 shadow-pop transition-transform hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          ) : null}

          <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
          <button
            type="button"
            onClick={() => scrollBy(300)}
            aria-label="Scroll categories"
            className="absolute -right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-gray-700 shadow-pop transition-transform hover:scale-105"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      ) : null}
    </div>
  );
}