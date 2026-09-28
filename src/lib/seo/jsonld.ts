/**
 * schema.org JSON-LD builders.
 *
 * These are the highest-leverage SEO assets for a property marketplace:
 * they let Google understand the business (RealEstateAgent), the geography
 * (areaServed), and individual listings (Product + Offer) instead of only
 * seeing an empty client-rendered shell.
 *
 * Google does not support schema.org's `RealEstateListing` type for rich
 * results, so listings are emitted as `Product` + `Offer` (the same approach
 * Airbnb uses), with `additionalType` narrowing to a residence type and
 * `offers.businessFunction` distinguishing sale from rental.
 */

import type { PublicPropertyDTO, PropertyType } from '@immo/shared-types';
import {
  absoluteUrl,
  BRAND,
  BUSINESS,
  DEFAULT_LOCALE,
  SITE_NAME,
  SITE_URL,
  SOCIAL,
} from './config';
import type { JsonLdEntity } from './head';

const GR = 'http://purl.org/goodrelations/v1';

/** All 18 provinces of Burundi, used for areaServed coverage. */
export const BURUNDI_PROVINCES = [
  'Bujumbura Mairie',
  'Bujumbura Rural',
  'Bubanza',
  'Bururi',
  'Cankuzo',
  'Cibitoke',
  'Gitega',
  'Karuzi',
  'Kayanza',
  'Kirundo',
  'Makamba',
  'Muramvya',
  'Muyinga',
  'Mwaro',
  'Ngozi',
  'Rumonge',
  'Rutana',
  'Ruyigi',
] as const;

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationSchema(): JsonLdEntity {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(BRAND.logoPath),
      width: 500,
      height: 500,
    },
    image: absoluteUrl(BRAND.ogImagePath),
    description:
      'IMMO BURUNDI is a real estate marketplace connecting buyers, tenants, investors, landlords and verified agents across Burundi.',
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
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: BUSINESS.telephone,
        contactType: 'customer service',
        email: BUSINESS.email,
        availableLanguage: ['fr', 'en', 'sw'],
        areaServed: 'BI',
      },
    ],
    sameAs: [SOCIAL.facebook, SOCIAL.twitter, SOCIAL.instagram, SOCIAL.linkedin],
  };
}

export function websiteSchema(): JsonLdEntity {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: DEFAULT_LOCALE,
    publisher: { '@id': ORGANIZATION_ID },
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

/**
 * The business itself, marked as a RealEstateAgent so it can qualify for
 * local results and map-pack style placements.
 */
export function realEstateAgentSchema(): JsonLdEntity {
  return {
    '@type': 'RealEstateAgent',
    '@id': `${SITE_URL}/#realestateagent`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(BRAND.logoPath),
    image: absoluteUrl(BRAND.ogImagePath),
    description:
      'Buy, rent and invest in property across Burundi. Browse verified houses, apartments, land and commercial listings in Bujumbura, Gitega, Ngozi and every province.',
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    priceRange: BUSINESS.priceRange,
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
    areaServed: BURUNDI_PROVINCES.map((name) => ({
      '@type': 'Country',
      name: 'Burundi',
      // Area-served provinces are expressed as contained places.
      alternateName: name,
    })),
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: BUSINESS.latitude,
        longitude: BUSINESS.longitude,
      },
      geoRadius: 400000,
    },
    sameAs: [SOCIAL.facebook, SOCIAL.twitter, SOCIAL.instagram, SOCIAL.linkedin],
    parentOrganization: { '@id': ORGANIZATION_ID },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdEntity {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageSchema(options: {
  name: string;
  description: string;
  path: string;
  breadcrumbs?: BreadcrumbItem[];
}): JsonLdEntity {
  const page: JsonLdEntity = {
    '@type': 'WebPage',
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    inLanguage: DEFAULT_LOCALE,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': `${SITE_URL}/#realestateagent` },
  };
  if (options.breadcrumbs?.length) {
    page.breadcrumb = { '@id': `${absoluteUrl(options.path)}#breadcrumb` };
  }
  return page;
}

/** Maps an internal PropertyType onto the closest schema.org residence type. */
const RESIDENCE_TYPE: Partial<Record<PropertyType, string>> = {
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

/** Sale, auction, rent, lease and investment map to goodrelations functions. */
function businessFunction(listingType: string): string {
  switch (listingType) {
    case 'RENT':
    case 'LEASE':
      return `${GR}LeaseOut`;
    default:
      return `${GR}Sell`;
  }
}

export function propertyListingSchema(property: PublicPropertyDTO): JsonLdEntity {
  const url = absoluteUrl(`/property/${property._id || property.id}`);
  const images = (property.media ?? [])
    .map((item) => item.url ?? item.thumbUrl)
    .filter((value): value is string => Boolean(value))
    .map((value) => absoluteUrl(value));

  const primaryImage =
    property.media?.find((item) => item.isPrimary) ??
    (property.media?.length ? property.media[0] : undefined);
  const heroImage = primaryImage?.url ?? primaryImage?.thumbUrl;

  const { province, commune, zone, address, latitude, longitude, locationPrecision } =
    property.location;

  const isForSale = property.listingType === 'SALE' || property.listingType === 'AUCTION';

  const listing: JsonLdEntity = {
    '@type': 'Product',
    '@id': `${url}#listing`,
    name: property.title,
    description: property.description?.slice(0, 500) || property.title,
    url,
    sku: property.propertyId,
    ...(images.length ? { image: images } : {}),
    ...(heroImage ? { thumbnailUrl: absoluteUrl(heroImage) } : {}),
    additionalType: RESIDENCE_TYPE[property.propertyType] ?? 'Residence',
    category: `${isForSale ? 'For sale' : 'For rent'} property in Burundi`,
    ...(property.publishedAt || property.createdAt
      ? { releaseDate: (property.publishedAt ?? property.createdAt) as string }
      : {}),
    offers: {
      '@type': 'Offer',
      url,
      price: property.price.amount,
      priceCurrency: property.price.currency,
      availability: 'https://schema.org/InStock',
      businessFunction: businessFunction(property.listingType),
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#realestateagent` },
      areaServed: {
        '@type': 'City',
        name: commune?.name ?? BUSINESS.addressLocality,
        containedInPlace: { '@type': 'Country', name: 'Burundi' },
      },
    },
    address: {
      '@type': 'PostalAddress',
      ...(address ? { streetAddress: address } : {}),
      addressLocality: commune?.name ?? BUSINESS.addressLocality,
      addressRegion: province?.name ?? BUSINESS.addressRegion,
      ...(zone?.name ? { addressNeighborhood: zone.name } : {}),
      addressCountry: BUSINESS.addressCountry,
    },
    ...(property.features?.surfaceArea
      ? {
          additionalProperty: [
            {
              '@type': 'PropertyValue',
              name: 'floorSize',
              value: `${property.features.surfaceArea} m²`,
            },
            ...(property.features.bedrooms
              ? [
                  {
                    '@type': 'PropertyValue',
                    name: 'numberOfBedrooms',
                    value: property.features.bedrooms,
                  },
                ]
              : []),
            ...(property.features.bathrooms
              ? [
                  {
                    '@type': 'PropertyValue',
                    name: 'numberOfBathroomsTotal',
                    value: property.features.bathrooms,
                  },
                ]
              : []),
          ],
        }
      : {}),
  };

  // geo must be withheld when the agent chose to hide the exact position.
  if (
    locationPrecision !== 'HIDDEN' &&
    typeof latitude === 'number' &&
    typeof longitude === 'number'
  ) {
    listing.geo = { '@type': 'GeoCoordinates', latitude, longitude };
  }

  return listing;
}

export interface ItemListEntry {
  name: string;
  path: string;
}

/** Drives the "top results" style presentation for listing/result pages. */
export function itemListSchema(name: string, entries: ItemListEntry[]): JsonLdEntity {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: entries.length,
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      url: absoluteUrl(entry.path),
    })),
  };
}
