import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_LINKS: Array<{ labelKey: string; to: string }> = [
  { labelKey: 'nav.buy', to: '/buy' },
  { labelKey: 'nav.rent', to: '/rent' },
  { labelKey: 'nav.land', to: '/land' },
  { labelKey: 'nav.commercial', to: '/commercial' },
  { labelKey: 'nav.featured', to: '/featured' },
  { labelKey: 'nav.verified', to: '/verified' },
  { labelKey: 'nav.agents', to: '/agents' },
];

/** Google-style search overlay — opens over everything, auto-focuses the input. */
export default function SearchModal({ open, onClose }: SearchModalProps): JSX.Element | null {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const id = setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(id);
    };
  }, [open, onClose]);

  const goTo = (href: string) => {
    onClose();
    navigate(href);
  };

  const submit = (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    goTo(`/search?${new URLSearchParams({ q: term }).toString()}`);
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[16vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-950/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            role="dialog"
            aria-modal="true"
            aria-label={t('common.search')}
            className="relative w-full max-w-lg rounded-2xl bg-surface p-2 shadow-pop"
          >
            <div className="flex items-center gap-2 rounded-xl bg-field px-3">
              <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
                placeholder={t('search.placeholder')}
                aria-label={t('common.search')}
                className="h-12 min-w-0 flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-placeholder"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('common.search')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="px-3 py-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                {t('search.quickLinks')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_LINKS.map((l) => (
                  <button
                    key={l.labelKey}
                    type="button"
                    onClick={() => goTo(l.to)}
                    className="rounded-full bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    {t(l.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}