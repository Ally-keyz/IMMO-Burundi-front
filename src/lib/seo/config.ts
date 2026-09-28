/**
 * Global SEO configuration.
 *
 * The canonical origin is read from the VITE_SITE_URL env var so that no
 * domain is hard-coded. Set it once at build time:
 *
 *   VITE_SITE_URL=https://immoburundi.netlify.app
 *
 * Everything that needs an absolute URL (canonical links, Open Graph,
 * sitemap.xml, JSON-LD @id) goes through absoluteUrl() so a staging build
 * can never emit production URLs by accident.
 */

const DEFAULT_SITE_URL = 'https://immoburundi.netlify.app';

function normaliseOrigin(value: string | undefined | null): string {
  const raw = (value ?? '').trim();
  if (!raw) return DEFAULT_SITE_URL;
  // Tolerate a missing scheme ("immoburundi.bi") so a misconfigured env
  // var degrades to a valid absolute URL instead of a relative one.
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = normaliseOrigin(import.meta.env.VITE_SITE_URL);

export const SITE_NAME = 'IMMO BURUNDI';

export const TITLE_SEPARATOR = '|';

export const DEFAULT_LOCALE = 'fr';

export const BRAND = {
  logoPath: '/assets/brand/logo.png',
  ogImagePath: '/og-image.png',
  /** 1200x630 is the size Facebook/X/LinkedIn render without cropping. */
  ogImageWidth: 1200,
  ogImageHeight: 630,
} as const;

/** Physical location used for LocalBusiness / RealEstateAgent markup. */
export const BUSINESS = {
  streetAddress: 'Avenue de la Révolution',
  addressLocality: 'Bujumbura',
  addressRegion: 'Bujumbura Mairie',
  postalCode: 'BP 2270',
  addressCountry: 'BI',
  telephone: '+25779000000',
  email: 'contact@immoburundi.bi',
  latitude: -3.3614,
  longitude: 29.3599,
  priceRange: 'BIF',
} as const;

export const SOCIAL = {
  facebook: 'https://www.facebook.com/immoburundi',
  twitter: 'https://twitter.com/immoburundi',
  instagram: 'https://www.instagram.com/immoburundi',
  linkedin: 'https://www.linkedin.com/company/immoburundi',
} as const;

/**
 * Build an absolute URL for a site-relative path.
 * Query strings and fragments are preserved; slashes are normalised.
 */
export function absoluteUrl(path: string = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${withLeadingSlash}`;
}

/** Strips query/hash so a path can be used for a canonical URL. */
export function toPathname(path: string): string {
  const withoutHash = path.split('#')[0] ?? '';
  const pathname = withoutHash.split('?')[0] ?? '';
  return pathname === '' ? '/' : pathname.replace(/\/+$/, '') || '/';
}
