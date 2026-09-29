import { useEffect, useRef, useState, type RefObject } from 'react';

interface Popover {
  ref: RefObject<HTMLDivElement>;
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

/**
 * Click-to-toggle popover state with outside-click + Escape dismissal.
 *
 * `panelRef` is the portalled menu (see `components/Popover.tsx`). It has to be
 * passed in, otherwise a click on a menu option counts as "outside", the panel
 * unmounts on `mousedown`, and the `click` that would have selected the option
 * never fires.
 */
export function usePopover(panelRef?: RefObject<HTMLElement>): Popover {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const insideTrigger = ref.current?.contains(target) ?? false;
      const insidePanel = panelRef?.current?.contains(target) ?? false;
      if (!insideTrigger && !insidePanel) setOpen(false);
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
  }, [open, panelRef]);

  return { ref, open, toggle: () => setOpen((o) => !o), setOpen };
}