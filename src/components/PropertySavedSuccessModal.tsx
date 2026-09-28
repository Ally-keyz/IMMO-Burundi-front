import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ImageIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PropertySavedSuccessModalProps {
  open: boolean;
  propertyTitle: string;
  photoCount: number;
  status?: string;
  mode: 'created' | 'updated';
  onClose: () => void;
}

/** Small centered green confirmation shown after a property has been created or updated. */
export default function PropertySavedSuccessModal({
  open,
  propertyTitle,
  photoCount,
  status,
  mode,
  onClose,
}: PropertySavedSuccessModalProps): JSX.Element | null {
  const { t } = useLanguage();

  const note =
    status === 'SUBMITTED'
      ? t('list.submittedForReview')
      : status === 'DRAFT'
        ? t('list.savedAsDraft')
        : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-950/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'created' ? t('list.propertyAdded') : t('list.propertyUpdated')}
            className="relative w-full max-w-sm rounded-2xl bg-verified p-6 text-center text-white shadow-pop"
          >
            <CheckCircle2 className="mx-auto h-12 w-12 text-white" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-bold">
              {mode === 'created' ? t('list.propertyAdded') : t('list.propertyUpdated')}
            </h3>
            <p className="mt-1 text-sm font-semibold text-white">{propertyTitle}</p>
            <p className="mt-1 text-sm text-white/90">
              {mode === 'created' ? t('list.propertyAddedBody') : t('list.propertyUpdatedBody')}
            </p>

            <div className="mt-4 flex flex-col gap-2 text-left text-sm text-white/95">
              <span className="flex items-center justify-center gap-1.5">
                <ImageIcon className="h-4 w-4" aria-hidden="true" />
                {t('list.propertyPhotosSaved', { count: photoCount })}
              </span>
              {note ? (
                <span className="rounded-lg bg-surface/20 px-3 py-1.5 text-center text-xs">
                  {note}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-full bg-surface px-4 py-2 text-sm font-semibold text-verified transition-colors hover:bg-gray-50"
            >
              {t('common.done')}
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
