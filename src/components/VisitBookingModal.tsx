import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { PropertyMediaDTO } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import VisitBookingWizard from './VisitBookingWizard';

interface VisitBookingModalProps {
  open: boolean;
  propertyId: string;
  media?: PropertyMediaDTO[];
  onClose: () => void;
  onPlaced?: (reference: string) => void;
}

/** Bottom sheet for booking a visit — slides up, full width, leaves 24% at the top. */
export default function VisitBookingModal({ open, propertyId, media, onClose, onPlaced }: VisitBookingModalProps): JSX.Element | null {
  const { t } = useLanguage();

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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-950/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label={t('visit.bookVisit')}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[92vh] w-full flex-col rounded-t-4xl bg-surface shadow-pop"
          >
            <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-gray-200" aria-hidden="true" />
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <h2 className="text-lg font-bold text-gray-900">{t('visit.bookVisit')}</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
              <VisitBookingWizard propertyId={propertyId} media={media} onPlaced={onPlaced} />
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}