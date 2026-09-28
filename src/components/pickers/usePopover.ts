import { useEffect, useRef, useState, type RefObject } from 'react';

interface Popover {
  ref: RefObject<HTMLDivElement>;
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

/** Click-to-toggle popover state with outside-click + Escape dismissal. */
export function usePopover(): Popover {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return { ref, open, toggle: () => setOpen((o) => !o), setOpen };
}