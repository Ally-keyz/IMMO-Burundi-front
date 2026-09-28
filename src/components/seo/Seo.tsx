import { useEffect, useLayoutEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  absoluteUrl,
  BRAND,
  SITE_NAME,
  TITLE_SEPARATOR,
  toPathname,
} from '../../lib/seo/config';
import { organizationSchema, realEstateAgentSchema, websiteSchema } from '../../lib/seo/jsonld';
import type { JsonLdEntity } from '../../lib/seo/head';
import { jsonLdGraph, setHtmlLang } from '../../lib/seo/head';

/** Google truncates snippets past ~155-160 characters. */
export const MAX_DESCRIPTION_LENGTH = 158;

export interface SeoProps {
  /** Page title. The site name is appended automatically. */
  title: string;
  description: string;
  /** Site-relative path used for the canonical URL, e.g. '/buy'. */
  path: string;
  /** Site-relative or absolute image for social previews. */
  image?: string;
  type?: 'website' | 'article' | 'product';
  /** Keeps the page out of the index (auth, transactional, 404). */
  noindex?: boolean;
  nofollow?: boolean;
  keywords?: string;
  jsonLd?: JsonLdEntity | JsonLdEntity[] | null;
}

/**
 * Escapes a JSON-LD payload for safe embedding inside a <script> element.
 * Without this, a property description containing "</script>" would break out
 * of the script block and inject markup.
 */
function toSafeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * Head mutations must be committed before the browser paints, otherwise a
 * crawler or a fast navigation can observe the previous route's metadata.
 * Falls back to useEffect where there is no document (prerender/SSR).
 */
const useHeadEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Identifies tags this component owns so it can update them in place and
 * delete the ones a route no longer needs (e.g. `keywords`).
 */
const MANAGED_ATTR = 'data-seo';
const JSON_LD_ID = 'jsonld';

type MetaSpec = ['name' | 'property', string, string];

/**
 * Applies a metadata plan to <head>.
 *
 * Tags are matched by selector before being created, so the markup emitted by
 * the build-time prerenderer (`scripts/seo-build.mjs`) is reused rather than
 * duplicated when a prerendered route hydrates.
 */
function applyHead(metas: MetaSpec[], links: Array<[string, string]>, jsonLd: string | null): void {
  const head = document.head;
  const desired = new Set<string>();

  for (const [kind, key, content] of metas) {
    const id = `${kind}:${key}`;
    desired.add(id);
    let el = head.querySelector<HTMLMetaElement>(`[${MANAGED_ATTR}="${id}"]`);
    if (!el) el = head.querySelector<HTMLMetaElement>(`meta[${kind}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(kind, key);
      head.appendChild(el);
    }
    el.setAttribute(MANAGED_ATTR, id);
    el.setAttribute('content', content);
  }

  for (const [rel, href] of links) {
    const id = `link:${rel}`;
    desired.add(id);
    let el = head.querySelector<HTMLLinkElement>(`[${MANAGED_ATTR}="${id}"]`);
    if (!el) el = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      head.appendChild(el);
    }
    el.setAttribute(MANAGED_ATTR, id);
    el.setAttribute('href', href);
  }

  if (jsonLd) {
    desired.add(JSON_LD_ID);
    let script =
      head.querySelector<HTMLScriptElement>(`[${MANAGED_ATTR}="${JSON_LD_ID}"]`) ??
      head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      head.appendChild(script);
    }
    script.setAttribute(MANAGED_ATTR, JSON_LD_ID);
    if (script.textContent !== jsonLd) script.textContent = jsonLd;
  }

  for (const el of Array.from(head.querySelectorAll(`[${MANAGED_ATTR}]`))) {
    const id = el.getAttribute(MANAGED_ATTR);
    if (id && !desired.has(id)) el.remove();
  }
}

export function clampDescription(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_DESCRIPTION_LENGTH) return clean;
  // Reserve one character for the ellipsis, otherwise a description with no
  // spaces to break on would come out one character over the cap.
  const cut = clean.slice(0, MAX_DESCRIPTION_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function buildTitle(title: string): string {
  const clean = title.trim();
  if (!clean || clean === SITE_NAME) return SITE_NAME;
  return `${clean} ${TITLE_SEPARATOR} ${SITE_NAME}`;
}

/**
 * Document metadata for a route.
 *
 * The tags are applied imperatively rather than returned as JSX. React only
 * hoists `<title>`, `<meta>` and `<link>` into <head> from React 19 onwards;
 * on React 18.3.1 they are rendered inline inside the component's parent
 * node, where browsers ignore them (a `<title>` in the body does not set
 * `document.title`) and crawlers do not read them. Since this app runs on
 * React 18, the head has to be updated through the DOM.
 *
 * Build-time prerendering is unaffected: `scripts/seo-build.mjs` writes the
 * same tags straight into the generated HTML, and the selectors above reuse
 * those nodes instead of adding a second copy.
 */
export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  nofollow = false,
  keywords,
  jsonLd,
}: SeoProps) {
  const { language } = useLanguage();

  // The <html lang> attribute was previously pinned to "en" and never updated.
  useHeadEffect(() => {
    setHtmlLang(language);
  }, [language]);

  const fullTitle = buildTitle(title);
  const cleanDescription = clampDescription(description);
  const canonical = absoluteUrl(toPathname(path));
  const socialImage = absoluteUrl(image ?? BRAND.ogImagePath);
  const robots = [noindex ? 'noindex' : 'index', nofollow ? 'nofollow' : 'follow'].join(', ');

  // Serialised up front so the effect depends on a primitive: callers usually
  // build the schema inline, which would otherwise re-run the effect on every
  // render because the array identity changes each time.
  const jsonLdPayload = jsonLd ? toSafeJsonLd(jsonLdGraph(jsonLd)) : null;

  useHeadEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = fullTitle;

    const metas: MetaSpec[] = [
      ['name', 'description', cleanDescription],
      ['name', 'robots', robots],
      ['property', 'og:site_name', SITE_NAME],
      ['property', 'og:type', type],
      ['property', 'og:title', fullTitle],
      ['property', 'og:description', cleanDescription],
      ['property', 'og:url', canonical],
      ['property', 'og:image', socialImage],
      ['property', 'og:image:width', String(BRAND.ogImageWidth)],
      ['property', 'og:image:height', String(BRAND.ogImageHeight)],
      ['property', 'og:locale', language.replace('-', '_')],
      ['name', 'twitter:card', 'summary_large_image'],
      ['name', 'twitter:title', fullTitle],
      ['name', 'twitter:description', cleanDescription],
      ['name', 'twitter:image', socialImage],
    ];
    if (keywords) metas.push(['name', 'keywords', keywords]);

    applyHead(metas, [['canonical', canonical]], jsonLdPayload);
  }, [
    fullTitle,
    cleanDescription,
    canonical,
    socialImage,
    robots,
    type,
    keywords,
    jsonLdPayload,
    language,
  ]);

  return null;
}

/**
 * Entities that belong on every indexable page: who we are, what the site
 * is, and where we operate. Emitted alongside the per-page schemas.
 */
let cachedGlobal: JsonLdEntity[] | null = null;

export function globalJsonLd(): JsonLdEntity[] {
  if (!cachedGlobal) {
    cachedGlobal = [organizationSchema(), websiteSchema(), realEstateAgentSchema()];
  }
  return cachedGlobal;
}

/** Combines page-specific schemas with the site-wide ones. */
export function withGlobalJsonLd(page: JsonLdEntity | JsonLdEntity[] | null | undefined) {
  if (!page) return globalJsonLd();
  return [...globalJsonLd(), ...(Array.isArray(page) ? page : [page])];
}
