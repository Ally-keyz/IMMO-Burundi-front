/**
 * Head helpers shared by the runtime app and the build-time prerenderer.
 *
 * Page metadata itself is rendered declaratively by the <Seo> component
 * (see components/seo/Seo.tsx) so the exact same tags are produced in the
 * browser and in prerendered HTML. Only document-level attributes that
 * cannot be expressed as a rendered element live here.
 */

export type JsonLdEntity = Record<string, unknown>;

/** JSON-LD context every emitted graph must declare. */
export const SCHEMA_CONTEXT = 'https://schema.org';

/**
 * Wraps schema entities in a top-level {@link SCHEMA_CONTEXT} graph.
 *
 * A bare array of entities is not valid JSON-LD: without an "@context" the
 * terms ("@type", "name", "offers", ...) have no defined vocabulary, so
 * consumers cannot resolve them. Emitting a single
 * `{"@context": ..., "@graph": [...]}` object keeps every entity addressable
 * and lets "@id" references between them resolve within the graph.
 */
export function jsonLdGraph(entities: JsonLdEntity | JsonLdEntity[]): JsonLdGraph {
  return {
    '@context': SCHEMA_CONTEXT,
    '@graph': Array.isArray(entities) ? entities : [entities],
  };
}

export interface JsonLdGraph extends JsonLdEntity {
  '@context': typeof SCHEMA_CONTEXT;
  '@graph': JsonLdEntity[];
}

/**
 * Keeps the <html lang> attribute in sync with the active UI language.
 *
 * This was previously hard-coded to "en" in index.html and never updated,
 * which mis-declared the document language for crawlers and screen readers
 * on a site whose default language is French.
 */
export function setHtmlLang(lang: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', lang);
}
