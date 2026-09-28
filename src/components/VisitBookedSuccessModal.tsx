import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import type { AgentSummary } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { whatsappChatUrl } from '../lib/whatsapp';

interface VisitBookedSuccessModalProps {
  open: boolean;
  reference: string;
  agent?: AgentSummary;
  propertyTitle?: string;
  onClose: () => void;
}

/** Small centered green confirmation shown after a visit has been placed. */
export default function VisitBookedSuccessModal({ open, reference, agent, propertyTitle, onClose }: VisitBookedSuccessModalProps): JSX.Element | null {
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

  const chatUrl = whatsappChatUrl(agent?.phone, t('contact.whatsappProperty', { title: propertyTitle ?? '' }));

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
            aria-label={t('visit.placedTitle')}
            className="relative w-full max-w-xs rounded-2xl bg-verified p-6 text-center text-white shadow-pop"
          >
            <CheckCircle2 className="mx-auto h-12 w-12 text-white" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-bold">{t('visit.placedTitle')}</h3>
            <p className="mt-1 text-sm text-white/90">{t('visit.placedSuccess')}</p>
            <p className="mx-auto mt-3 inline-block rounded-full bg-surface/20 px-3 py-1 font-mono text-sm font-semibold">{reference}</p>
            {chatUrl ? (
              <a
                href={chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-verified transition-colors hover:bg-gray-50"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {t('contact.whatsappCta')}
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-full bg-surface px-4 py-2 text-sm font-semibold text-verified hover:bg-gray-50"
            >
              {t('visit.done')}
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}