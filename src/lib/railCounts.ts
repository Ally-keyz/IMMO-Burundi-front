import { useEffect, useState } from 'react';
import { adminApi, agentPropertiesApi, agentsApi, enquiriesApi, favoritesApi, rentalApplicationsApi, usersApi, verificationApi, visitsApi } from './api';

export type RailRole = 'AGENT' | 'CUSTOMER' | 'ADMIN';

type Counts = Record<string, number>;

/** Badge counts are cached so the rail doesn't re-fire requests on every page change. */
const TTL_MS = 30_000;
let cache: { at: number; role: RailRole | null; data: Counts } = { at: 0, role: null, data: {} };
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

/** Drops the cache and nudges every mounted rail to refetch. */
export function invalidateRailCounts(): void {
  cache = { at: 0, role: null, data: {} };
  notify();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function readRailCounts(role: RailRole): Counts | null {
  return cache.role === role && Date.now() - cache.at < TTL_MS ? cache.data : null;
}

function writeRailCounts(role: RailRole, data: Counts): void {
  cache = { at: Date.now(), role, data };
}

/** Enquiries an agent still owes a reply to - mirrors the actionable set in
    `BookingsInquiriesTab`, so the badge always matches a visible "Respond" action. */
const ACTIONABLE_ENQUIRY_STATUSES = ['NEW', 'OPEN'];

async function fetchCounts(role: RailRole): Promise<Counts> {
  const next: Counts = {};
  if (role === 'CUSTOMER') {
    const [fav, views, bookings, apps, buys] = await Promise.allSettled([
      favoritesApi.list(1, 1),
      usersApi.getRecentViews(),
      visitsApi.getMyBookings(),
      rentalApplicationsApi.getMine(),
      enquiriesApi.getMine(),
    ]);
    if (fav.status === 'fulfilled') next.favorites = fav.value.meta.total;
    if (views.status === 'fulfilled') next.recentViews = views.value.meta.total;
    if (bookings.status === 'fulfilled') next.visits = bookings.value.meta.total;
    /* "My applications" shows rent applications *and* buy requests. */
    if (apps.status === 'fulfilled' || buys.status === 'fulfilled') {
      next.applications =
        (apps.status === 'fulfilled' ? apps.value.meta.total : 0) +
        (buys.status === 'fulfilled' ? buys.value.meta.total : 0);
    }
    return next;
  }
  if (role === 'AGENT') {
    const me = await agentsApi.me().catch(() => null);
    if (!me) return next;
    const propsRes = await agentPropertiesApi
      .list({ page: 1, pageSize: 1 })
      .then((res) => res.meta.total)
      .catch(() => 0);
    next.myProperties = propsRes;
    /* Unanswered enquiries from the agent inbox. Visit bookings are left out on
       purpose: that list is built with one request per property, far too heavy to
       run on every rail load. */
    next.bookings = await enquiriesApi
      .inbox()
      .then((rows) => (rows ?? []).filter((r) => ACTIONABLE_ENQUIRY_STATUSES.includes(String(r?.status ?? '').toUpperCase())).length)
      .catch(() => 0);
    /* Distinct properties still waiting on a decision or missing an item to fix.
       Counted off `items`, not the summary totals, so a property that is both
       pending and incomplete is only badged once. */
    next.verification = await verificationApi
      .portfolio()
      .then((res) =>
        (res.items ?? []).filter(
          (i) => i.activeRequest?.isPending || i.missingCount > 0 || i.needsCorrection || Boolean(i.adminNote),
        ).length,
      )
      .catch(() => 0);
    return next;
  }
  if (role === 'ADMIN') {
    /* One summary call carries every admin badge - the server already counts each
       actionable queue, so the rail never has to list anything. */
    const pending = await adminApi
      .summary()
      .then((res) => res.pending)
      .catch(() => null);
    if (!pending) return next;
    next.overview = pending.total;
    next.agents = pending.agents;
    next.properties = pending.properties;
    next.bookings = pending.bookings;
    next.requests = pending.requests;
    next.verification = pending.verification;
    return next;
  }
  return next;
}

/**
 * Rail badge counts with a shared 30s cache. `invalidateRailCounts()` (called after
 * booking a visit, cancelling one, favouriting, …) makes every mounted rail refetch
 * immediately so badges increment without a page reload.
 */
export function useRailCounts(role: RailRole): Counts {
  const [counts, setCounts] = useState<Counts>(() => readRailCounts(role) ?? {});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const cached = readRailCounts(role);
      if (cached) {
        if (!cancelled) setCounts(cached);
        return;
      }
      const next = await fetchCounts(role);
      writeRailCounts(role, next);
      if (!cancelled) setCounts(next);
    };

    void load();
    const unsubscribe = subscribe(() => {
      void load();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [role]);

  return counts;
}
