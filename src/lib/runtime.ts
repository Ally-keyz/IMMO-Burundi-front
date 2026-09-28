/**
 * Deployment-aware origin resolution.
 *
 * The app ships with a same-origin assumption: every call targets `/api`,
 * uploaded media is referenced as `/uploads/...` and the realtime channel
 * dials the page origin. That single assumption is what makes local dev work
 * (the Vite dev server proxies all three to the API) and it is also what
 * `netlify.toml` reproduces in production by reverse-proxying to Render.
 *
 * When the two apps *must* live on different domains — no proxy, a custom
 * API domain, or a Render URL that changes with every free-tier redeploy —
 * set VITE_API_BASE_URL to the backend origin and every consumer in the app
 * switches over. Leaving it empty is a valid, fully-supported configuration.
 *
 *   VITE_API_BASE_URL=https://immo-api.onrender.com
 */

/** Absolute backend origin, or `''` when the API is same-origin. */
export const BACKEND_ORIGIN = normaliseOrigin(import.meta.env.VITE_API_BASE_URL);

/** Origin serving `/uploads/*`. Defaults to the backend origin, else same-origin. */
export const UPLOADS_BASE_URL =
  normaliseOrigin(import.meta.env.VITE_UPLOADS_BASE_URL) || BACKEND_ORIGIN;

/** Axios base URL. Never ends in a slash, always carries the `/api` prefix. */
export const API_BASE_URL = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : '/api';

/** Socket.io dial target. `'/'` means "the page origin". */
export const SOCKET_URL = BACKEND_ORIGIN || '/';

/** True when the API is on a different origin than the page. */
export const IS_CROSS_ORIGIN_API = BACKEND_ORIGIN !== '';

/**
 * Turns a backend-relative asset path into something the browser can load.
 *
 * Only matters when the API is cross-origin: `null`/undefined passes through
 * as an empty string so callers can drop the result straight into `src`.
 */
export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^(?:https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  if (!UPLOADS_BASE_URL) return url;
  return `${UPLOADS_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function normaliseOrigin(value: string | undefined | null): string {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  // Tolerate a missing scheme so a misconfigured env var degrades to a valid
  // absolute origin rather than an unresolvable one.
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return '';
  }
}
