/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin, e.g. `https://immo-api.onrender.com`. Empty = same origin (reverse-proxied). */
  readonly VITE_API_BASE_URL?: string;
  /** Origin that serves `/uploads/*`. Falls back to VITE_API_BASE_URL. Empty = same origin. */
  readonly VITE_UPLOADS_BASE_URL?: string;
  /** Origin the Vite dev server proxies `/api`, `/uploads` and `/socket.io` to. */
  readonly VITE_API_PROXY_TARGET?: string;
  /** Canonical origin for SEO. Required in production. */
  readonly VITE_SITE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_MAPS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
