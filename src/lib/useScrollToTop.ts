import { useEffect, type DependencyList } from 'react';

/**
 * Scrolls the window (or a scrollable element) back to the top whenever `deps` change.
 * Used when swapping dashboard tabs and modal steps, where the new content otherwise
 * renders at the previous scroll offset.
 */
export function useScrollToTop(deps: DependencyList, behavior: ScrollBehavior = 'auto'): void {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior });
  }, deps);
}

/** Scrolls a scrollable container to the top. Pass a ref, or omit to target the window. */
export function useScrollContainerToTop(
  ref: { current: HTMLElement | null },
  deps: DependencyList,
  behavior: ScrollBehavior = 'auto',
): void {
  useEffect(() => {
    ref.current?.scrollTo({ top: 0, left: 0, behavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
