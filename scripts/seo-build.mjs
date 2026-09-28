/**
 * Postbuild SEO step.
 *
 * The web app is a client-rendered SPA, so by itself it only ever ships one
 * generic HTML shell. This script runs after `vite build` and produces the
 * artefacts a crawler needs:
 *
 *   1. robots.txt            - crawl directives + sitemap pointer
 *   2. sitemap.xml           - every indexable URL with real priorities
 *   3. prerendered HTML      - static pages, province landing pages, and
 *                              (when the API is reachable) property pages
 *
 * The prerendered HTML contains genuine headings, body copy, canonical
 * links and JSON-LD, so crawlers that do not execute JavaScript still see
 * the content. The SPA then takes over on the client.
 *
 * Everything degrades gracefully: if the API cannot be reached the property
 * pages are simply skipped and the build still succeeds.
 *
 * Config:
 *   VITE_SITE_URL   canonical origin (defaults to https://immoburundi.netlify.app)
 *   SEO_API_BASE    API origin used to enrich the sitemap (default /api -> same origin)
 *   SEO_FETCH_API   set to 1 to prerender property pages from a running API
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');

/**
 * Walk up to the nearest directory containing .git so a repo-root .env is
 * picked up. A fixed '../..' would escape the repository entirely once the
 * app is deployed as its own repo (this repo has the app at its root).
 */
function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const repoRoot = findRepoRoot(appDir);
const distDir = path.join(appDir, 'dist');

const DEFAULT_SITE_URL = 'https://immoburundi.netlify.app';
const log = (...args) => console.log('[seo]', ...args);

/* ── minimal .env reader (avoids a dotenv dependency) ─────────────── */
function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = {
  ...readEnvFile(path.join(repoRoot, '.env')),
  ...readEnvFile(path.join(appDir, '.env')),
  ...readEnvFile(path.join(appDir, '.env.production')),
};

function envValue(key) {
  const fromProcess = process.env[key];
  if (fromProcess !== undefined && fromProcess !== '') return fromProcess;
  return fileEnv[key];
}

const SITE_URL = (envValue('VITE_SITE_URL') || DEFAULT_SITE_URL)
  .trim()
  .replace(/\/+$/, '');

const absolute = (p) => `${SITE_URL}${p.startsWith('/') ? p : `/${p}`}`;

/* ── shared constants mirrored from src/lib/seo/config.ts ─────────── */
const SITE_NAME = 'IMMO BURUNDI';
const BUSINESS = {
  telephone: '+25779000000',
  email: 'contact@immoburundi.bi',
  streetAddress: 'Avenue de la Revolution',
  addressLocality: 'Bujumbura',
  addressRegion: 'Bujumbura Mairie',
  postalCode: 'BP 2270',
  addressCountry: 'BI',
  latitude: -3.3614,
  longitude: 29.3599,
};
const SOCIAL = [
  'https://www.facebook.com/immoburundi',
  'https://twitter.com/immoburundi',
  'https://www.instagram.com/immoburundi',
  'https://www.linkedin.com/company/immoburundi',
];
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const AGENT_ID = `${SITE_URL}/#realestateagent`;

/* ── location data (single source of truth with the app) ──────────── */
const locationsJson = JSON.parse(
  fs.readFileSync(path.join(appDir, 'src', 'lib', 'seo', 'burundi-locations.json'), 'utf8'),
);
const PROVINCES = locationsJson.provinces;
const COUNTRY = locationsJson.country;

/* ── schema.org builders ──────────────────────────────────────────── */
function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: absolute('/assets/brand/logo.png') },
    image: absolute('/og-image.png'),
    email: BUSINESS.email,
    telephone: BUSINESS.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.addressLocality,
      addressRegion: BUSINESS.addressRegion,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.addressCountry,
    },
    sameAs: SOCIAL,
  };
}

function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: 'fr',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

function realEstateAgentSchema() {
  return {
    '@type': 'RealEstateAgent',
    '@id': AGENT_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: `Buy, rent and invest in property across ${COUNTRY}. Verified houses, apartments, land and commercial listings in Bujumbura, Gitega, Ngozi and every province.`,
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    priceRange: 'BIF',
    currenciesAccepted: 'BIF, USD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.addressLocality,
      addressRegion: BUSINESS.addressRegion,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.latitude,
      longitude: BUSINESS.longitude,
    },
    areaServed: PROVINCES.map((p) => ({ '@type': 'Country', name: COUNTRY, alternateName: p.name })),
    sameAs: SOCIAL,
    parentOrganization: { '@id': ORG_ID },
  };
}

function breadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Inverse of escapeHtml, for reading a value back out of existing markup. */
const unescapeHtml = (value) =>
  String(value ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');

const safeJsonLd = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

/**
 * Mirrors jsonLdGraph() in src/lib/seo/head.ts. A bare array of schema
 * entities is not valid JSON-LD because no vocabulary is declared, so the
 * entities are wrapped in a top-level @context + @graph object. The "@id"
 * values on Organization/WebSite/RealEstateAgent then resolve as references
 * to other nodes in the same graph.
 */
const jsonLdGraph = (entities) => ({
  '@context': 'https://schema.org',
  '@graph': Array.isArray(entities) ? entities : [entities],
});

/**
 * Mirrors clampDescription() in src/components/seo/Seo.tsx. The prerendered
 * pages must not ship longer descriptions than the runtime pages, otherwise
 * the same route advertises a different snippet depending on whether the
 * crawler read the static file or the hydrated DOM.
 */
const MAX_DESCRIPTION_LENGTH = 158;

function clampDescription(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_DESCRIPTION_LENGTH) return clean;
  const cut = clean.slice(0, MAX_DESCRIPTION_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}\u2026`;
}

/* ── HTML shell ───────────────────────────────────────────────────── */
function readAssetTags() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log('WARNING: dist/index.html not found, skipping prerender');
    return { css: [], js: '' };
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map((m) => m[0]);
  const jsMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"[^>]*><\/script>/);
  return { css, js: jsMatch ? `<script type="module" src="${jsMatch[1]}"></script>` : '' };
}

let assetTags = { css: [], js: '' };

function buildHtml({ title, description, canonical, jsonLd, bodyHtml, extraHead = '', noindex = false }) {
  const metaDescription = clampDescription(description);
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(metaDescription)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(metaDescription)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${absolute('/og-image.png')}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
    <meta name="twitter:image" content="${absolute('/og-image.png')}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/site.webmanifest" />
    ${extraHead}
    <script type="application/ld+json" data-seo="jsonld">${safeJsonLd(jsonLdGraph(jsonLd))}</script>
    ${assetTags.css.join('\n    ')}
    <style>
      body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#111827;background:#fff}
      .wrap{max-width:1100px;margin:0 auto;padding:48px 20px}
      .eyebrow{color:#0B5FFF;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
      h1{font-size:clamp(28px,5vw,44px);line-height:1.15;margin:12px 0 16px}
      p{line-height:1.7;color:#4b5563;max-width:70ch}
      nav a{display:inline-block;margin:8px 12px 8px 0;padding:10px 18px;border:1px solid #d1d5db;border-radius:999px;text-decoration:none;color:#111827;font-size:14px}
      footer{margin-top:48px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280}
      footer a{color:#0B5FFF}
    </style>
  </head>
  <body>
    <div id="root">${bodyHtml}</div>
    ${assetTags.js}
  </body>
</html>
`;
}

function writeHtml(routePath, html) {
  const clean = routePath.replace(/^\/+|\/+$/g, '');
  const dir = clean === '' ? distDir : path.join(distDir, clean);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

/**
 * Writes dist/404.html for static hosts, which serve this file with a real
 * 404 status. Without it the SPA fallback answers unknown URLs with the home
 * page and a 200, which reads as a soft 404: the site would report unlimited
 * distinct URLs all with the same content.
 */
function writeNotFoundPage() {
  const html = buildHtml({
    title: 'Page introuvable',
    description: "La page demandee n'existe pas ou a ete deplacee.",
    // The page is noindex, and there is no /404 route to point at, so the
    // canonical is the site root rather than a URL that would 404 itself.
    canonical: absolute('/'),
    noindex: true,
    h1: 'Page introuvable',
    paragraphs: [
      "La page demandee n'existe pas ou a ete deplacee.",
      'Recherchez un bien ou parcourir les provinces ci-dessous.',
    ],
    nav: [
      { href: '/', label: 'Accueil' },
      { href: '/buy', label: 'Achat' },
      { href: '/rent', label: 'Location' },
      { href: '/land', label: 'Terrains' },
      { href: '/search', label: 'Recherche avancee' },
    ],
    jsonLd: [organizationSchema(), websiteSchema()],
  });
  fs.writeFileSync(path.join(distDir, '404.html'), html, 'utf8');
  log('wrote 404.html (noindex)');
}

/* ── 1. robots.txt ────────────────────────────────────────────────── */
function writeRobots() {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Authenticated, transactional and wizard routes carry no search value.',
    'Disallow: /dashboard',
    'Disallow: /settings',
    'Disallow: /list-property',
    'Disallow: /login',
    'Disallow: /signup',
    'Disallow: /register',
    'Disallow: /pay/',
    'Disallow: /setup-account',
    '',
    '# Faceted search permutations are canonicalised to /search.',
    'Disallow: /search?*',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(distDir, 'robots.txt'), body, 'utf8');
  log('robots.txt written');
}

/* ── 2. sitemap.xml ───────────────────────────────────────────────── */
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/buy', priority: '0.9', changefreq: 'daily' },
  { path: '/rent', priority: '0.9', changefreq: 'daily' },
  { path: '/land', priority: '0.85', changefreq: 'daily' },
  { path: '/verified', priority: '0.8', changefreq: 'daily' },
  { path: '/commercial', priority: '0.8', changefreq: 'daily' },
  { path: '/search', priority: '0.7', changefreq: 'daily' },
  { path: '/featured', priority: '0.7', changefreq: 'weekly' },
  { path: '/agents', priority: '0.6', changefreq: 'weekly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
  { path: '/verification-disclaimer', priority: '0.3', changefreq: 'yearly' },
];

const today = () => new Date().toISOString().slice(0, 10);

function urlEntry({ path: routePath, lastmod, priority, changefreq }) {
  return [
    '  <url>',
    `    <loc>${escapeHtml(absolute(routePath))}</loc>`,
    `    <lastmod>${lastmod ?? today()}</lastmod>`,
    `    <changefreq>${changefreq ?? 'weekly'}</changefreq>`,
    `    <priority>${priority ?? '0.5'}</priority>`,
    '  </url>',
  ].join('\n');
}

function writeSitemap(extraUrls) {
  const locationRoutes = PROVINCES.map((p) => ({
    path: `/immobilier/${p.slug}`,
    priority: p.isCapital ? '0.9' : '0.8',
    changefreq: 'daily',
  }));

  const entries = [
    ...STATIC_ROUTES.map((r) => urlEntry(r)),
    ...locationRoutes.map((r) => urlEntry(r)),
    ...(extraUrls ?? []).map((r) => urlEntry(r)),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf8');
  log(`sitemap.xml written (${STATIC_ROUTES.length + locationRoutes.length + (extraUrls?.length ?? 0)} urls)`);
}

/* ── 3. prerendered pages ─────────────────────────────────────────── */
function buildStaticPage({ title, description, path: routePath, h1, paragraphs, nav, jsonLd }) {
  const bodyHtml = `
    <div class="wrap">
      <p class="eyebrow">${SITE_NAME}</p>
      <h1>${escapeHtml(h1)}</h1>
      ${paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('\n      ')}
      <nav>${nav.map((n) => `<a href="${escapeHtml(n.href)}">${escapeHtml(n.label)}</a>`).join('')}</nav>
      <footer>
        <p><strong>${SITE_NAME}</strong> &middot; ${escapeHtml(BUSINESS.addressLocality)}, ${COUNTRY}</p>
        <p><a href="/">Accueil</a> &middot; <a href="/buy">Achat</a> &middot; <a href="/rent">Location</a> &middot; <a href="/search">Recherche</a></p>
      </footer>
    </div>`;

  return buildHtml({
    title: `${title} | ${SITE_NAME}`,
    description,
    canonical: absolute(routePath),
    jsonLd: [...jsonLd],
    bodyHtml,
  });
}

function prerenderStaticPages() {
  const pages = [
    {
      path: '/buy',
      title: 'Achat immobilier en Burundi',
      h1: 'Acheter un immobilier au Burundi',
      description:
        "ACHETER IMMOBILIER AU BURUNDI : maisons, villas, appartements et terrains a vendre a Bujumbura, Gitega, Ngozi et dans les 18 provinces. Prix en BIF, annonces verifiees, contact direct avec l'agent.",
      paragraphs: [
        "IMMO BURUNDI regroupe les proprietes a vendre dans les 18 provinces du Burundi. Que vous cherchiez une maison de ville a Bujumbura, une villa avec jardin, un appartement neuf ou un terrain a batir, les annonces sont classees par province et par commune.",
        "Chaque bien affiche son prix en BIF, sa surface, son nombre de chambres et sa localisation. Les proprietes verifiees portent un badge specifique : leurs titres et leurs informations ont ete controles par nos equipes.",
        "Contactez directement l'agent ou le proprietaire depuis la fiche du bien. Le paiement de l'acompte peut se faire de maniere securisee par lien de paiement.",
      ],
      nav: [
        { href: '/rent', label: 'Louer' },
        { href: '/land', label: 'Terrains' },
        { href: '/commercial', label: 'Commercial' },
        { href: '/search', label: 'Recherche avancee' },
      ],
      crumbs: [
        { name: 'Accueil', path: '/' },
        { name: 'Acheter', path: '/buy' },
      ],
    },
    {
      path: '/rent',
      title: 'Location immobiliere au Burundi',
      h1: 'Louer un immobilier au Burundi',
      description:
        "LOCATION IMMOBILIERE AU BURUNDI : appartements, villas et maisons a louer a Bujumbura et dans tout le pays. Prix en BIF, annonces verifiees, bail clair et contact direct avec le proprietaire.",
      paragraphs: [
        "Le marche locatif burundais se concentre principalement a Bujumbura, ou se trouvent la majorite des appartements, villas et maisons en location. Gitega, Ngozi et les autres capitales de province completent l'offre.",
        "Les annonces indiquent le loyer mensuel ou annuel en BIF, la surface, le nombre de chambres et la commune. Beaucoup de proprietes sont situees dans des quartiers recherchees comme Mukaza, Ntahangwa et Rohero.",
        "Signs de bail, caution et charges : demandez toujours les details avant de vous engager. Un lien de paiement peut servir a verser la caution de facon securisee.",
      ],
      nav: [
        { href: '/buy', label: 'Acheter' },
        { href: '/land', label: 'Terrains' },
        { href: '/search', label: 'Recherche avancee' },
      ],
      crumbs: [
        { name: 'Accueil', path: '/' },
        { name: 'Louer', path: '/rent' },
      ],
    },
    {
      path: '/land',
      title: 'Terrain a vendre au Burundi',
      h1: 'Acheter un terrain au Burundi',
      description:
        'TERRAIN A VENDRE AU BURUNDI : parcelles constructibles, terrains agricoles et terres a batir a Bujumbura, Gitega, Ngozi, Kayanza et dans les 18 provinces. Prix au m2 en BIF, contact direct avec le proprietaire.',
      paragraphs: [
        "Le terrain est la categorie la plus recherchee sur le marche burundais, en particulier les parcelles constructibles a proximite de Bujumbura et les terres agricoles de l'Ouest et du Nord.",
        "Les annonces precisent la surface en m2, la localisation dans la province et la commune, et le prix demande. Certaines parcelles sont vendues au metre carre, d'autres en bloc.",
        "Avant tout achat, verifiez le titre foncier et les limites de la parcelle aupres de l'autorite competente. Nos agents peuvent vous accompagner dans cette verification.",
      ],
      nav: [
        { href: '/buy', label: 'Acheter' },
        { href: '/rent', label: 'Louer' },
        { href: '/search', label: 'Recherche avancee' },
      ],
      crumbs: [
        { name: 'Accueil', path: '/' },
        { name: 'Terrains', path: '/land' },
      ],
    },
    {
      path: '/commercial',
      title: 'Immobilier commercial au Burundi',
      h1: 'Immobilier commercial au Burundi',
      description:
        "IMMOBILIER COMMERCIAL AU BURUNDI : bureaux, commerces, entrepots et espaces a louer ou a vendre a Bujumbura. Locations pour entreprises, prix en BIF, annonces verifiees.",
      paragraphs: [
        "Bureaux, commerces de centre-ville, entrepots et ateliers : IMMO BURUNDI reference l'immobilier commercial burundais pour les entreprises comme pour les investisseurs.",
        "Les espaces a louer sont particularly demandes dans le centre de Bujumbura, ou se concentrent les commerces, les cabinets et les societes.",
        "Pour une location commerciale, verifiez le bail, les charges, le parking et les conditions de resiliation avant de signer.",
      ],
      nav: [
        { href: '/buy', label: 'Acheter' },
        { href: '/rent', label: 'Louer' },
        { href: '/search', label: 'Recherche avancee' },
      ],
      crumbs: [
        { name: 'Accueil', path: '/' },
        { name: 'Commercial', path: '/commercial' },
      ],
    },
    {
      path: '/about',
      title: `A propos de ${SITE_NAME}`,
      h1: `A propos de ${SITE_NAME}`,
      description: `IMMO BURUNDI est la marketplace immobiliere du Burundi : achat, location et vente de proprietes a Bujumbura et dans les 18 provinces, avec des agents et des biens verifies.`,
      paragraphs: [
        `${SITE_NAME} est une marketplace immobiliere burundaise. Notre objectif est de rendre l'achat et la location de proprietes plus simples et plus transparents, du premier coup d'oeil jusqu'a la signature.`,
        "Nous couvrons les 18 provinces du Burundi, de Bujumbura Mairie a Ruyigi, pour les maisons, villas, appartements, terrains et locaux commerciaux.",
        "Chaque annonce indique le prix, la localisation, la surface et l'etat de verification. Les biens verifies ont ete controles par nos equipes.",
      ],
      nav: [
        { href: '/buy', label: 'Acheter' },
        { href: '/rent', label: 'Louer' },
        { href: '/search', label: 'Recherche avancee' },
      ],
      crumbs: [
        { name: 'Accueil', path: '/' },
        { name: 'A propos', path: '/about' },
      ],
    },
  ];

  for (const page of pages) {
    const html = buildStaticPage({
      title: page.title,
      description: page.description,
      path: page.path,
      h1: page.h1,
      paragraphs: page.paragraphs,
      nav: page.nav,
      jsonLd: [
        organizationSchema(),
        websiteSchema(),
        realEstateAgentSchema(),
        breadcrumbSchema(page.crumbs),
      ],
    });
    writeHtml(page.path, html);
  }
  log(`prerendered ${pages.length} static pages`);
}

function prerenderLocationPages() {
  for (const province of PROVINCES) {
    const routePath = `/immobilier/${province.slug}`;
    const title = `Immobilier a ${province.name} : achat et location`;
    const description =
      `${province.blurb} Achat et location de maisons, villas, appartements et terrains a ${province.name}, ${COUNTRY}.`;

    const html = buildStaticPage({
      title,
      description,
      path: routePath,
      h1: `Immobilier a ${province.name} : achat et location`,
      paragraphs: [province.blurb],
      nav: [
        { href: '/buy', label: 'Achat' },
        { href: '/rent', label: 'Location' },
        { href: '/land', label: 'Terrains' },
        { href: '/search', label: 'Recherche avancee' },
        ...PROVINCES.filter((p) => p.slug !== province.slug)
          .slice(0, 8)
          .map((p) => ({ href: `/immobilier/${p.slug}`, label: p.name })),
      ],
      jsonLd: [
        organizationSchema(),
        websiteSchema(),
        realEstateAgentSchema(),
        breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: 'Immobilier', path: '/search' },
          { name: province.name, path: routePath },
        ]),
      ],
    });
    writeHtml(routePath, html);
  }
  log(`prerendered ${PROVINCES.length} province pages`);
}

/* ── optional: property pages from a live API ─────────────────────── */
const RESIDENCE_TYPE = {
  HOUSE: 'SingleFamilyResidence',
  VILLA: 'SingleFamilyResidence',
  APARTMENT: 'Apartment',
  FARM: 'Farm',
  HOTEL: 'Hotel',
  GUEST_HOUSE: 'GuestHouse',
  OFFICE: 'OfficeBuilding',
  WAREHOUSE: 'Warehouse',
  INDUSTRIAL: 'IndustrialBuilding',
  SHOP: 'Store',
  COMMERCIAL: 'CommercialBuilding',
  LAND: 'LandPlot',
};

function propertySchema(property) {
  const url = absolute(`/property/${property._id ?? property.id}`);
  const media = Array.isArray(property.media) ? property.media : [];
  const images = media
    .map((m) => m.url ?? m.thumbUrl)
    .filter(Boolean)
    .map((image) => absolute(image));
  const isRental = property.listingType === 'RENT' || property.listingType === 'LEASE';
  const location = property.location ?? {};
  const specs = [];

  if (property.features?.surfaceArea) {
    specs.push(`${property.features.surfaceArea} m2`);
  }
  if (property.features?.bedrooms) {
    specs.push(
      `${property.features.bedrooms} chambre${property.features.bedrooms > 1 ? 's' : ''}`,
    );
  }
  if (property.features?.bathrooms) {
    specs.push(`${property.features.bathrooms} salle(s) de bain`);
  }

  const schema = {
    '@type': 'Product',
    '@id': `${url}#listing`,
    name: property.title,
    description: (property.description ?? property.title).slice(0, 500),
    url,
    sku: property.propertyId,
    additionalType: RESIDENCE_TYPE[property.propertyType] ?? 'Residence',
    offers: {
      '@type': 'Offer',
      url,
      price: property.price?.amount,
      priceCurrency: property.price?.currency ?? 'BIF',
      availability: 'https://schema.org/InStock',
      businessFunction: isRental
        ? 'http://purl.org/goodrelations/v1/LeaseOut'
        : 'http://purl.org/goodrelations/v1/Sell',
      seller: { '@id': AGENT_ID },
    },
    address: {
      '@type': 'PostalAddress',
      ...(location.address ? { streetAddress: location.address } : {}),
      addressLocality: location.commune?.name ?? BUSINESS.addressLocality,
      addressRegion: location.province?.name ?? BUSINESS.addressRegion,
      addressCountry: BUSINESS.addressCountry,
    },
  };
  if (images.length) schema.image = images;
  if (
    location.locationPrecision !== 'HIDDEN' &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number'
  ) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }
  return schema;
}

async function prerenderPropertyPages(apiBase) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let payload;
  try {
    const response = await fetch(`${apiBase}/properties?pageSize=200&status=PUBLISHED`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    payload = await response.json();
  } catch (error) {
    log(`API unreachable (${error.message}) - skipping property prerender`);
    return [];
  } finally {
    clearTimeout(timer);
  }

  const items = payload?.data?.items ?? payload?.items ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    log('no published properties returned - skipping property prerender');
    return [];
  }

  const urls = [];
  for (const property of items) {
    const id = property._id ?? property.id;
    if (!id) continue;
    const routePath = `/property/${id}`;
    const isRental = property.listingType === 'RENT' || property.listingType === 'LEASE';
    const place = [
      property.location?.commune?.name,
      property.location?.province?.name,
    ]
      .filter(Boolean)
      .join(', ');
    const price = `${property.price?.amount ?? ''} ${property.price?.currency ?? 'BIF'}`.trim();
    const specs = [];
    if (property.features?.surfaceArea) specs.push(`${property.features.surfaceArea} m2`);
    if (property.features?.bedrooms) {
      specs.push(`${property.features.bedrooms} chambre${property.features.bedrooms > 1 ? 's' : ''}`);
    }
    if (property.features?.bathrooms) {
      specs.push(`${property.features.bathrooms} salle(s) de bain`);
    }

    const html = buildStaticPage({
      title: `${property.title}${place ? ` a ${property.location.commune.name}` : ''} ${isRental ? 'a louer' : 'a vendre'}`,
      description: `${property.title} ${isRental ? 'a louer' : 'a vendre'}${place ? ` a ${place}` : ''} au Burundi. ${specs.join(', ')}. Prix : ${price}.`,
      path: routePath,
      h1: property.title,
      paragraphs: [
        [isRental ? 'A louer' : 'A vendre', place, `Prix : ${price}`, specs.join(', ')]
          .filter(Boolean)
          .join(' - '),
        (property.description ?? '').slice(0, 600),
      ].filter(Boolean),
      nav: [
        { href: isRental ? '/rent' : '/buy', label: isRental ? 'Autres locations' : 'Autres achats' },
        { href: '/search', label: 'Recherche avancee' },
        ...(property.location?.province?.name
          ? [
              {
                href: '/search?province=' + encodeURIComponent(property.location.province.name),
                label: `Autres biens a ${property.location.province.name}`,
              },
            ]
          : []),
      ],
      jsonLd: [
        organizationSchema(),
        realEstateAgentSchema(),
        propertySchema(property),
        breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: isRental ? 'Louer' : 'Acheter', path: isRental ? '/rent' : '/buy' },
          { name: property.title, path: routePath },
        ]),
      ],
    });
    writeHtml(routePath, html);
    urls.push({ path: routePath, lastmod: property.publishedAt?.slice(0, 10), priority: '0.7' });
  }

  log(`prerendered ${urls.length} property pages`);
  return urls;
}

/* ── run ──────────────────────────────────────────────────────────── */
function main() {
  if (!fs.existsSync(distDir)) {
    log('ERROR: dist/ not found. Run `vite build` first.');
    process.exit(1);
  }
  log(`site url: ${SITE_URL}`);
  assetTags = readAssetTags();

  writeRobots();
  hardenShell();
  writeNotFoundPage();
  prerenderStaticPages();
  prerenderLocationPages();

  const apiBase = envValue('SEO_API_BASE');
  const shouldFetch = envValue('SEO_FETCH_API') === '1';

  if (shouldFetch && apiBase) {
    prerenderPropertyPages(apiBase.replace(/\/+$/, ''))
      .then((urls) => {
        writeSitemap(urls);
        log('done');
      })
      .catch((error) => {
        log(`property prerender failed (${error.message}) - continuing`);
        writeSitemap([]);
        log('done');
      });
  } else {
    if (shouldFetch && !apiBase) {
      log('SEO_FETCH_API=1 but SEO_API_BASE is not set - skipping property prerender');
    } else {
      log('property prerender disabled (set SEO_FETCH_API=1 and SEO_API_BASE to enable)');
    }
    writeSitemap([]);
    log('done');
  }
}

/**
 * Repairs the app shell (dist/index.html), which is what the homepage is
 * served from and what non-JS consumers read.
 *
 * WhatsApp and Facebook do not execute JavaScript, so the shell - not the
 * hydrated DOM - is what produces a link preview. Two things were wrong in
 * it: the social image was a root-relative path (scrapers require an
 * absolute URL, so previews had no image), and it carried no canonical, no
 * og:url and no robots tag. The same pass injects the site-wide JSON-LD,
 * which otherwise only existed on the prerendered routes.
 *
 * The body is left untouched: the real home page is rendered by React, and
 * writing static marketing copy into the shell would duplicate it.
 */
function hardenShell() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log('WARNING: dist/index.html not found, skipping shell hardening');
    return;
  }
  let html = fs.readFileSync(indexPath, 'utf8');
  const before = html;

  // Clamp the shell's description to the same limit the runtime and the
  // prerendered pages use, so the homepage does not ship a snippet that
  // Google truncates at an arbitrary word.
  html = html.replace(
    /(<meta\s+name="description"\s+content=")([^"]*)(")/s,
    (_m, open, content, close) => `${open}${escapeHtml(clampDescription(unescapeHtml(content)))}${close}`,
  );

  // Absolute social image: scrapers do not resolve relative URLs.
  const absoluteImage = absolute('/og-image.png');
  html = html.replace(
    /(<meta\s+property="og:image"\s+content=")\/og-image\.png(")/g,
    `$1${absoluteImage}$2`,
  );
  html = html.replace(
    /(<meta\s+name="twitter:image"\s+content=")\/og-image\.png(")/g,
    `$1${absoluteImage}$2`,
  );

  // Multi-line variants, in case the tag is wrapped across lines.
  if (!/property="og:image"[^>]*content="https?:/s.test(html)) {
    html = html.replace(
      /(<meta\s+property="og:image"\s+content=")[^"]*(")/s,
      `$1${absoluteImage}$2`,
    );
  }
  if (!/name="twitter:image"[^>]*content="https?:/s.test(html)) {
    html = html.replace(
      /(<meta\s+name="twitter:image"\s+content=")[^"]*(")/s,
      `$1${absoluteImage}$2`,
    );
  }

  const homeUrl = absolute('/');
  const additions = [];
  if (!/<link[^>]+rel="canonical"/.test(html)) {
    additions.push(`<link rel="canonical" href="${homeUrl}" />`);
  }
  if (!/property="og:url"/.test(html)) {
    additions.push(`<meta property="og:url" content="${homeUrl}" />`);
  }
  if (!/name="robots"/.test(html)) {
    additions.push('<meta name="robots" content="index, follow" />');
  }
  if (additions.length) {
    html = html.replace('</head>', `  ${additions.join('\n  ')}\n  </head>`);
  }

  const graph = jsonLdGraph([
    organizationSchema(),
    websiteSchema(),
    realEstateAgentSchema(),
    breadcrumbSchema([{ name: 'Accueil', path: '/' }]),
  ]);
  const tag = `<script type="application/ld+json" data-seo="jsonld">${safeJsonLd(graph)}</script>`;
  const existing = /<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/.exec(html);
  if (existing) html = html.replace(existing[0], tag);
  else if (html.includes('</head>')) html = html.replace('</head>', `  ${tag}\n  </head>`);
  else {
    log('WARNING: no </head> in dist/index.html, skipping shell JSON-LD');
    return;
  }

  if (html !== before) fs.writeFileSync(indexPath, html);
  log(
    `shell hardened (absolute social image${additions.length ? `, +${additions.length} tag(s)` : ''}, JSON-LD injected)`,
  );
}

main();
