/**
 * Response-shaping DTOs — Backend Spec §97.
 * Each DTO strips fields the caller's role isn't entitled to.
 */
import {
  CurrencyCode, Language, ListingType, LocationPrecision,
  MediaType, PermissionScope, PropertyStatus, PropertyType,
  VerificationStatus, VerificationResult,
} from './enums.js';

/* ── Shared sub-types ─────────────────────────────────────── */

export interface GeoRef {
  _id: string;
  code: string;
  name: string;
}

export interface PriceInfo {
  amount: number;
  currency: CurrencyCode;
  convertedAmount?: number;
  convertedCurrency?: CurrencyCode;
  exchangeRate?: number;
  rateDate?: string;
}

export interface PropertyFeatures {
  surfaceArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  rooms?: number;
  floors?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  isNegotiable?: boolean;
}

export interface PropertyMediaDTO {
  id: string;
  fileKey: string;
  url?: string;
  thumbUrl?: string;
  caption?: string;
  isPrimary: boolean;
  mediaType: MediaType;
  sortOrder: number;
}

export interface PropertyLocation {
  province: GeoRef;
  commune: GeoRef;
  zone?: GeoRef;
  address?: string;
  latitude?: number;
  longitude?: number;
  locationPrecision: LocationPrecision;
}

export interface VerificationSummary {
  status: VerificationStatus;
  level?: string;
  code?: string;
  verifiedAt?: string;
  verificationResult?: VerificationResult;
  disclaimerVersion?: string;
}

export interface AgentSummary {
  id: string;
  agentCode: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  agencyName?: string;
  rating?: number;
  reviewsCount?: number;
  topAgent: boolean;
  totalProperties?: number;
  totalSales?: number;
  totalDeals?: number;
  province?: GeoRef;
  licenseNumber?: string;
  bio?: string;
  slogan?: string;
  phone?: string;
  email?: string;
}

/* ── Property DTOs (§97) ──────────────────────────────────── */

/** Public property card — used on home/search results. */
export interface PropertySummaryDTO {
  id: string;
  _id: string;
  propertyId: string;
  title: string;
  titleFr?: string;
  titleEn?: string;
  titleSw?: string;
  description?: string;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: PriceInfo;
  location: PropertyLocation;
  features: PropertyFeatures;
  media: PropertyMediaDTO[];
  agent?: AgentSummary;
  verification: VerificationSummary;
  stats: { views: number; favorites: number; shares: number };
  badges: { featured: boolean; isNew: boolean; isPromoted: boolean };
  publishedAt?: string;
  createdAt: string;
}

/** Full public property detail — property detail page. */
export interface PublicPropertyDTO extends PropertySummaryDTO {
  ownerFirstName?: string;
  verificationDisclaimer?: string;
}

/** Owner/landlord view — adds private owner fields + internal analytics. */
export interface OwnerPropertyDTO extends PublicPropertyDTO {
  ownerPhonePrivate?: string;
  ownerEmailPrivate?: string;
  ownerAddressPrivate?: string;
  createdByName?: string;
  approvedByName?: string;
  publishedByName?: string;
  ownerAnalytics: {
    totalViews: number;
    uniqueVisitors: number;
    whatsappClicks: number;
    phoneClicks: number;
    enquiries: number;
    visitBookings: number;
  };
  blockReason?: string;
  blockedAt?: string;
}

/** Agent view — agent-visible analytics. */
export interface AgentPropertyDTO extends OwnerPropertyDTO {
  agentAnalytics: {
    viewsGenerated: number;
    enquiriesGenerated: number;
    visitBookings: number;
    conversionRate?: number;
  };
  documents?: PropertyDocumentDTO[];
  verificationNotes?: string;
  rejectionReason?: string;
  /** Set while a verification request is still open, so the UI can lock the action. */
  pendingVerification?: { code: string; status: string } | null;
}

/** Admin view — everything including internal fields and owner private data. */
export interface AdminPropertyDTO extends OwnerPropertyDTO {
  ownerUserId?: string;
  ownerPhonePrivate?: string;
  ownerEmailPrivate?: string;
  ownerAddressPrivate?: string;
  landlordUserId?: string;
  createdById?: string;
  approvedById?: string;
  publishedById?: string;
  internalNotes?: string;
  documents?: PropertyDocumentDTO[];
  verificationNotes?: string;
  rejectionReason?: string;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  blockReason?: string;
  blockedAt?: string;
  blockedById?: string;
}

export interface PropertyDocumentDTO {
  id: string;
  documentType: string;
  fileName: string;
  fileId?: string;
  documentNumber?: string;
  issuedBy?: string;
  issueDate?: string;
  expiryDate?: string;
  verificationStatus: VerificationResult;
  verificationNotes?: string;
}

/* ── Auth / User DTOs ─────────────────────────────────────── */

export interface AuthTokenPayload {
  sub: string;          // user _id
  role: string;
  scopes?: string[];
  jti: string;
}

export interface UserPublicDTO {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role?: string;
  roleId?: string;
  photoUrl?: string;
  preferredLanguage: Language;
  preferredCurrency: CurrencyCode;
  status: string;
  createdAt: string;
}

export interface RegisterBody {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  role?: 'CUSTOMER';
  photoUrl?: string;
  preferredLanguage?: Language;
  preferredCurrency?: CurrencyCode;
}

export interface AccountSetupDTO {
  firstName: string;
  lastName: string;
  email: string;
  expiresAt: string;
}

export interface LoginBody {
  identifier: string; // phone or email
  password: string;
}

/* ── Agent verification portfolio ──────────────────────────── */

/**
 * One checklist line: something the agent must add or fix before the system
 * admin will accept the property. `key` is stable and machine-readable
 * (`document:LAND_TITLE`, `field:description`) so the UI can localise it.
 */
export interface VerificationRequirementDTO {
  key: string;
  kind: 'DOCUMENT' | 'FIELD';
  status: 'MET' | 'MISSING';
  /** Human-readable fallback when no translation exists for `key`. */
  label?: string;
  /** Attached filename, for document requirements. */
  fileName?: string;
  /** Per-document verification state, e.g. 'NOT_VERIFIED'. */
  note?: string;
}

/** The verification request currently in flight for a property, if any. */
export interface AgentVerificationRequestDTO {
  id: string;
  verificationCode: string;
  status: string;
  result?: string;
  rejectionReason?: string;
  requestedAt?: string;
  startedAt?: string;
  completedAt?: string;
  assignedOfficerName?: string;
  /** True while the request still awaits a decision. */
  isPending: boolean;
}

/** One property as the agent sees it on the Verification page. */
export interface AgentVerificationItemDTO {
  propertyId: string;
  title: string;
  thumbUrl?: string;
  listingType: string;
  propertyType: string;
  /** Property lifecycle status (DRAFT / PUBLISHED / NEEDS_CORRECTION …). */
  propertyStatus: string;
  /** The admin's verification verdict. */
  verificationStatus: string;
  verificationCode?: string;
  verifiedAt?: string;
  /** The admin's / officer's note — the authoritative "what to fix". */
  adminNote?: string;
  /** Property *review* verdict — a separate lifecycle from verification. */
  reviewNote?: string;
  rejectionReason?: string;
  needsCorrection: boolean;
  activeRequest: AgentVerificationRequestDTO | null;
  documents: PropertyDocumentDTO[];
  requirements: VerificationRequirementDTO[];
  /** Count of unmet requirements — drives the "needs action" badge. */
  missingCount: number;
}

export interface AgentVerificationPortfolioDTO {
  items: AgentVerificationItemDTO[];
  summary: {
    total: number;
    pending: number;
    verified: number;
    needsAction: number;
  };
}

/* ── Misc / shared ────────────────────────────────────────── */

export interface PaginatedQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PropertySearchQuery extends PaginatedQuery {
  q?: string;
  province?: string;
  commune?: string;
  zone?: string;
  propertyType?: PropertyType;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  bedrooms?: number;
  bathrooms?: number;
  verificationStatus?: VerificationStatus;
  status?: PropertyStatus;
  isFeatured?: boolean;
  agentId?: string;
}
