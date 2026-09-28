import { useCallback, useEffect, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export interface StripImage {
  id: string;
  src: string;
  caption?: string;
}

interface MediaStripProps {
  images: StripImage[];
  title: string;
  /** Thumbnails shown inline before the lightbox takes over. */
  previewCount?: number;
}

function srcOf(image: { url?: string | null; thumbUrl?: string | null }): string {
  return image.url || image.thumbUrl || '';
}

function BrokenThumb({ label }: { label: string }): JSX.Element {
  return (
    <span className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400" role="img" aria-label={label}>
      <ImageOff className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function Lightbox({ images, title, index, onClose, onIndex }: { images: StripImage[]; title: string; index: number; onClose: () => void; onIndex: (next: number) => void }): JSX.Element {
  const { t } = useLanguage();
  const go = useCallback((dir: 1 | -1) => onIndex((index + dir + images.length) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [go, onClose]);

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 text-white" onClick={(event) => event.stopPropagation()}>
        <p className="min-w-0 truncate text-sm font-medium">{title}</p>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs tabular-nums text-white/70">
            {index + 1} / {images.length}
          </span>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/10" aria-label={t('common.close')}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4" onClick={(event) => event.stopPropagation()}>
        {images.length > 1 ? (
          <button type="button" onClick={() => go(-1)} className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 sm:left-4" aria-label={t('media.previousPhoto')}>
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}

        <img
          key={current.id}
          src={current.src}
          alt={current.caption || title}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />

        {images.length > 1 ? (
          <button type="button" onClick={() => go(1)} className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 sm:right-4" aria-label={t('media.nextPhoto')}>
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="scrollbar-hide flex shrink-0 gap-2 overflow-x-auto px-4 pb-4" onClick={(event) => event.stopPropagation()}>
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onIndex(i)}
              aria-current={i === index}
              aria-label={`${t('media.photo')} ${i + 1}`}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === index ? 'border-white' : 'border-transparent opacity-55 hover:opacity-90'
              }`}
            >
              <img src={image.src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function MediaStrip({ images, title, previewCount = 3 }: MediaStripProps): JSX.Element {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  if (images.length === 0) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-400 sm:w-56 sm:shrink-0">
        <Building2 className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }

  const preview = images.slice(0, previewCount);
  const remaining = images.length - preview.length;

  return (
    <>
      <div className="flex min-w-0 gap-2 sm:w-56 sm:shrink-0">
        {preview.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            className="relative h-24 min-w-0 flex-1 overflow-hidden rounded-lg bg-gray-100 sm:h-28"
            aria-label={`${t('media.viewPhotos')} (${i + 1} ${t('media.of')} ${images.length})`}
          >
            {failed[image.id] ? (
              <BrokenThumb label={t('media.imageUnavailable')} />
            ) : (
              <img
                src={image.src}
                alt={i === 0 ? title : ''}
                loading="lazy"
                className="h-full w-full object-cover transition-transform hover:scale-105"
                onError={() => setFailed((prev) => ({ ...prev, [image.id]: true }))}
              />
            )}
            {i === preview.length - 1 && remaining > 0 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white">
                +{remaining}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {open ? <Lightbox images={images} title={title} index={index} onClose={() => setOpen(false)} onIndex={setIndex} /> : null}
    </>
  );
}

export { srcOf };
