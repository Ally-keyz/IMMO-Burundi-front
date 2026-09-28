import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element | JSX.Element[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  headerDivider?: boolean;
  fullBleed?: boolean;
  /** Ref to the scrollable body, so callers can reset scroll between steps. */
  bodyRef?: React.Ref<HTMLDivElement>;
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-[min(82vw,100rem)]',
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export default function Modal({ open, onClose, title, children, size = 'md', headerDivider = false, fullBleed = false, bodyRef }: ModalProps): JSX.Element | null {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  /* Call sites overwhelmingly pass an inline arrow (onClose={() => setOpen(false)}), so a new
     identity arrives on every parent render. Holding it in a ref keeps the focus effect
     below keyed to `open` alone — otherwise each keystroke tore the effect down, and the
     cleanup restored focus to the trigger, stealing the caret mid-word. */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;

    const focusableElements = (): HTMLElement[] =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => el.offsetParent !== null)
        : [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = focusableElements();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    panel?.addEventListener('keydown', handleKeyDown);
    panel?.focus();

    return () => {
      panel?.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`flex w-full max-h-[min(90dvh,60rem)] flex-col overflow-hidden rounded-t-2xl bg-surface shadow-pop outline-none focus:outline-none sm:rounded-2xl ${fullBleed ? 'p-0' : 'p-6'} ${SIZES[size]}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between ${
                fullBleed ? 'px-6 pb-4 pt-5' : ''
              } ${headerDivider ? 'mb-4 border-b border-gray-200 pb-4' : 'mb-4'}`}
            >
              <h2 id={titleId} className="text-lg font-bold text-gray-900">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div ref={bodyRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}