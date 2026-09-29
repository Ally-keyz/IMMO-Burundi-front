import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * A popover panel that escapes its ancestor's clipping and stacking context.
 *
 * The header's control row is `overflow-x-auto` inside a fixed-height `h-16`
 * bar, which makes it a scroll container on both axes: an `absolute` menu
 * placed at `top-full` is clipped by the header itself, and no z-index can
 * lift a child out of its parent's stacking context. Portalling to `document.body`
 * and anchoring with viewport coordinates is the only fix — it is the same
 * approach `Modal` and `SearchModal` already use.
 *
 * `align="end"` pins the panel's right edge to the trigger's right edge, which
 * is what an absolute `right-0` menu did.
 */
interface PopoverProps {
  open: boolean;
  /** The trigger element whose bounding box anchors the panel. */
  anchor: RefObject<HTMLElement>;
  /** Set by the caller so outside-click detection can see the portalled panel. */
  panelRef?: RefObject<HTMLDivElement>;
  align?: 'start' | 'end';
  offset?: number;
  className?: string;
  children: ReactNode;
}

export default function Popover({
  open,
  anchor,
  panelRef,
  align = 'end',
  offset = 8,
  className = '',
  children,
}: PopoverProps): JSX.Element | null {
  // Hidden until the first measurement so the panel never paints at 0,0.
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  const place = useCallback(() => {
    const el = anchor.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    // Keep the panel on screen even when the trigger sits hard against an edge.
    const right = align === 'end' ? Math.max(gap, window.innerWidth - rect.right) : undefined;
    const left = align === 'end' ? undefined : Math.max(gap, rect.left);
    setStyle({
      position: 'fixed',
      top: Math.round(rect.bottom + offset),
      ...(right !== undefined ? { right } : {}),
      ...(left !== undefined ? { left } : {}),
      visibility: 'visible',
    });
  }, [anchor, align, offset]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle({ visibility: 'hidden' });
      return;
    }
    place();
    // Capture phase so scrolling inside any nested container also repositions.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  // A trigger scrolled out of view leaves the panel floating over unrelated
  // content; closing it is less confusing than chasing it.
  useEffect(() => {
    if (!open) return;
    const el = anchor.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, anchor]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={style}
      // Below the modals (z-50 / z-[60]) and the search overlay (z-[60]), above
      // the sticky header and the nav-drawer scrim (both z-40).
      className={`z-[45] ${className}`}
      role="menu"
    >
      {children}
    </div>,
    document.body,
  );
}
