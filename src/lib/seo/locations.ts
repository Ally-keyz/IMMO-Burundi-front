/**
 * Burundi location helpers.
 *
 * The province list lives in burundi-locations.json so that the runtime app
 * and the postbuild SEO script (robots.txt / sitemap.xml / prerendered
 * location pages) always agree on the same set of slugs.
 */

import raw from './burundi-locations.json';

export interface BurundiProvince {
  name: string;
  slug: string;
  isCapital?: boolean;
  blurb: string;
}

export const COUNTRY = raw.country;
export const COUNTRY_CODE = raw.countryCode;

export const PROVINCES: BurundiProvince[] = raw.provinces;

export function findProvinceBySlug(slug: string | undefined): BurundiProvince | undefined {
  if (!slug) return undefined;
  const needle = slug.trim().toLowerCase();
  return PROVINCES.find((p) => p.slug === needle);
}

/** Canonical path for a province landing page. */
export function locationPath(slug: string): string {
  return `/immobilier/${slug}`;
}

/**
 * Diacritic- and case-insensitive match between a province name coming from
 * the database and a name in the static list, so the two data sources can be
 * joined even though one uses the seeded 3-letter codes and the other slugs.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
