import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronLeft, ChevronRight, Maximize, Minimize, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { PropertyMediaDTO } from '@immo/shared-types';

interface PropertyGalleryProps {
  images: PropertyMediaDTO[];
  title?: string;
}

interface ThumbnailRailProps {
  media: PropertyMediaDTO[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Vertical thumbnail strip overlaid at the top-left of the current image. */
function ThumbnailRail({ media, activeIndex, onSelect }: ThumbnailRailProps): JSX.Element {
  return (
    <div className="scrollbar-hide absolute left-3 top-3 z-20 flex w-16 flex-col gap-2 overflow-y-auto rounded-xl bg-black/25 p-2 backdrop-blur-sm">
      {media.map((img, i) => {
        const thumb = img.thumbUrl ?? img.url;
        const isActive = i === activeIndex;
        return thumb && i < media.length ? (
          <button
            key={img.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(i);
            }}
            className={`relative h-11 w-full shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
              isActive ? 'border-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            aria-label={`Photo ${i + 1}`}
            aria-current={isActive}
          >
            <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ) : (
          <span
            key={img.id}
            className="flex h-11 w-full shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-400"
          >
            <Building2 className="h-4 w-4" />
          </span>
        );
      })}
    </div>
  );
}

function Viewer({ media, activeIndex, active, zoomed, onSelect }: {
  media: PropertyMediaDTO[];
  activeIndex: number;
  active: PropertyMediaDTO | undefined;
  zoomed: boolean;
  onSelect: (i: number) => void;
}): JSX.Element {
  const dragOffset = useRef(0);
  const goTo = useCallback(
    (dir: 1 | -1) => {
      onSelect((activeIndex + dir + media.length) % media.length);
    },
    [media.length, activeIndex, onSelect],
  );

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden select-none">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={activeIndex}
          src={active?.url}
          alt={active?.caption || 'Property photo'}
          initial={{ opacity: 0, x: dragOffset.current }}
          animate={{ opacity: 1, x: 0, scale: zoomed ? 2 : 1 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ duration: 0.2 }}
          drag={zoomed ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragStart={() => {
            dragOffset.current = 0;
          }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -70) {
              dragOffset.current = -80;
              goTo(1);
            } else if (info.offset.x > 70) {
              dragOffset.current = 80;
              goTo(-1);
            }
          }}
          className={`h-full w-full cursor-grab object-contain active:cursor-grabbing ${
            zoomed ? 'cursor-zoom-out' : ''
          }`}
        />
      </AnimatePresence>
    </div>
  );
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps): JSX.Element {
  const photos = images.filter((m) => m.mediaType === 'IMAGE' || m.mediaType === 'FLOOR_PLAN');
  const media = photos.length > 0 ? photos : images;
  const [activeIndex, setActiveIndex] = useState(0);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef(0);

  const active = media[Math.min(activeIndex, Math.max(media.length - 1, 0))];
  const activeUrl = active?.url;

  useEffect(() => {
    setActiveIndex(0);
    setZoomed(false);
  }, [images.length]);

  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOverlayOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [overlayOpen]);

  const goTo = useCallback(
    (dir: 1 | -1) => {
      setZoomed(false);
      setActiveIndex((prev) => (media.length === 0 ? prev : (prev + dir + media.length) % media.length));
    },
    [media.length],
  );

  const openOverlay = () => setOverlayOpen(true);
  const closeOverlay = useCallback(() => setOverlayOpen(false), []);

  if (media.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gray-100 sm:aspect-[16/10]">
        <Building2 className="h-20 w-20 text-brand-600/30" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-2xl bg-gray-100">
      {/* Main image */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden select-none"
        onDoubleClick={() => setZoomed((z) => !z)}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          openOverlay();
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={activeIndex}
            src={activeUrl}
            alt={active?.caption || title || 'Property photo'}
            initial={{ opacity: 0, x: dragOffset.current }}
            animate={{ opacity: 1, x: 0, scale: zoomed ? 1.8 : 1 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.2 }}
            drag={zoomed ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragStart={() => {
              dragOffset.current = 0;
            }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) {
                dragOffset.current = -80;
                goTo(1);
              } else if (info.offset.x > 70) {
                dragOffset.current = 80;
                goTo(-1);
              }
            }}
            className={`h-full w-full cursor-grab object-cover active:cursor-grabbing ${
              zoomed ? 'cursor-zoom-out object-contain' : ''
            }`}
          />
        </AnimatePresence>

        {/* Gradient scrim */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Arrows */}
        <button
          type="button"
          onClick={() => goTo(-1)}
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-gray-800 shadow-md backdrop-blur transition-colors hover:bg-surface"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(1)}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-gray-800 shadow-md backdrop-blur transition-colors hover:bg-surface"
          aria-label="Next photo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Thumbnails: vertical rail at top-left, over the current image */}
        {media.length > 1 ? (
          <ThumbnailRail media={media} activeIndex={activeIndex} onSelect={setActiveIndex} />
        ) : null}

        {/* Bottom-left: counter */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="rounded-full bg-surface/85 px-2.5 py-1 text-xs font-semibold text-gray-800">
            {activeIndex + 1} / {media.length}
          </span>
          <span className="rounded-full bg-surface/85 px-2.5 py-1 text-xs font-medium text-gray-600">
            {active?.mediaType === 'FLOOR_PLAN' ? 'Floor plan' : 'Photo'}
          </span>
        </div>
        {/* Bottom-right: zoom + enlarge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/85 text-gray-800 shadow-md transition-colors hover:bg-surface"
            aria-label={zoomed ? 'Zoom out' : 'Zoom image'}
            title={zoomed ? 'Zoom out' : 'Zoom image'}
          >
            {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={openOverlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/85 text-gray-800 shadow-md transition-colors hover:bg-surface"
            aria-label="Enlarge image"
            title="Enlarge image"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lightbox — ≈80% of the screen, close + zoom + minimize at bottom */}
      <AnimatePresence>
        {overlayOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
            onClick={closeOverlay}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Property photos'}
          >
            <div
              className="relative h-[80vh] w-[min(90vw,1200px)] overflow-hidden rounded-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <Viewer media={media} activeIndex={activeIndex} active={active} zoomed={zoomed} onSelect={setActiveIndex} />

              {media.length > 1 ? (
                <ThumbnailRail media={media} activeIndex={activeIndex} onSelect={setActiveIndex} />
              ) : null}

              {/* arrows */}
              <button
                type="button"
                onClick={() => goTo(-1)}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-gray-800 shadow-md transition-colors hover:bg-surface"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(1)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-gray-800 shadow-md transition-colors hover:bg-surface"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* counter top-right */}
              <span className="absolute right-4 top-4 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-semibold text-gray-800">
                {activeIndex + 1} / {media.length}
              </span>

              {/* bottom-right: zoom, minimize, close */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomed((z) => !z)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/85 text-gray-800 shadow-md transition-colors hover:bg-surface"
                  aria-label={zoomed ? 'Zoom out' : 'Zoom image'}
                  title={zoomed ? 'Zoom out' : 'Zoom image'}
                >
                  {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={closeOverlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/85 text-gray-800 shadow-md transition-colors hover:bg-surface"
                  aria-label="Minimize image"
                  title="Minimize image"
                >
                  <Minimize className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={closeOverlay}
                  className="flex h-10 w-14 items-center justify-center rounded-full bg-surface text-notVerified shadow-md transition-colors hover:bg-gray-100"
                  aria-label="Close image"
                  title="Close image"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}