import type { ListingType, PropertyType, VerificationStatus } from '@immo/shared-types';

export interface Option<T extends string = string> {
  value: T;
  labelKey: string;
}

export const PROPERTY_TYPE_OPTIONS: Option<PropertyType>[] = [
  { value: 'HOUSE', labelKey: 'propertyType.HOUSE' },
  { value: 'APARTMENT', labelKey: 'propertyType.APARTMENT' },
  { value: 'VILLA', labelKey: 'propertyType.VILLA' },
  { value: 'LAND', labelKey: 'propertyType.LAND' },
  { value: 'SHOP', labelKey: 'propertyType.SHOP' },
  { value: 'OFFICE', labelKey: 'propertyType.OFFICE' },
  { value: 'WAREHOUSE', labelKey: 'propertyType.WAREHOUSE' },
  { value: 'COMMERCIAL', labelKey: 'propertyType.COMMERCIAL' },
  { value: 'INDUSTRIAL', labelKey: 'propertyType.INDUSTRIAL' },
  { value: 'FARM', labelKey: 'propertyType.FARM' },
  { value: 'HOTEL', labelKey: 'propertyType.HOTEL' },
  { value: 'GUEST_HOUSE', labelKey: 'propertyType.GUEST_HOUSE' },
  { value: 'OTHER', labelKey: 'propertyType.OTHER' },
];

export const LISTING_TYPE_OPTIONS: Option<ListingType>[] = [
  { value: 'SALE', labelKey: 'property.forSale' },
  { value: 'RENT', labelKey: 'property.forRent' },
  { value: 'LEASE', labelKey: 'property.forLease' },
  { value: 'AUCTION', labelKey: 'property.forAuction' },
  { value: 'INVESTMENT', labelKey: 'property.forInvestment' },
];

export const VERIFICATION_FILTER_OPTIONS: Option<VerificationStatus>[] = [
  { value: 'VERIFIED', labelKey: 'property.verified' },
  { value: 'PARTIAL', labelKey: 'property.partial' },
  { value: 'NOT_VERIFIED', labelKey: 'property.notVerified' },
  { value: 'FULLY_VERIFIED', labelKey: 'property.fullyVerified' },
];

export const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'search.sort.newest' },
  { value: 'priceAsc', labelKey: 'search.sort.priceAsc' },
  { value: 'priceDesc', labelKey: 'search.sort.priceDesc' },
  { value: 'views', labelKey: 'search.sort.views' },
  { value: 'featured', labelKey: 'search.sort.featured' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export const DEFAULT_EXCHANGE_RATE_USD_BIF = 2850;

export interface GeoOption {
  _id?: string;
  code: string;
  name: string;
}

/** Fallback list used before / on failure of GET /geo/provinces. */
export const FALLBACK_PROVINCES: GeoOption[] = [
  { code: 'BM', name: 'Bujumbura Mairie' },
  { code: 'BR', name: 'Bujumbura Rural' },
  { code: 'BU', name: 'Bururi' },
  { code: 'CN', name: 'Cankuzo' },
  { code: 'CI', name: 'Cibitoke' },
  { code: 'GI', name: 'Gitega' },
  { code: 'KA', name: 'Karuzi' },
  { code: 'KY', name: 'Kayanza' },
  { code: 'KI', name: 'Kirundo' },
  { code: 'MA', name: 'Makamba' },
  { code: 'MU', name: 'Muramvya' },
  { code: 'MY', name: 'Muyinga' },
  { code: 'MW', name: 'Mwaro' },
  { code: 'NG', name: 'Ngozi' },
  { code: 'RT', name: 'Rumonge' },
  { code: 'RY', name: 'Rutana' },
  { code: 'RU', name: 'Ruyigi' },
];

export const MEDIA_PLACEHOLDER_COLORS = [
  'from-brand-100 to-brand-300',
  'from-sky-100 to-sky-300',
  'from-emerald-100 to-emerald-300',
  'from-amber-100 to-amber-300',
  'from-violet-100 to-violet-300',
];