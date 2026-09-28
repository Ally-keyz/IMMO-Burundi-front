/**
 * IMMO BURUNDI — shared enums.
 *
 * Every enum is transcribed 1:1 from the four specification documents.
 * These are the source of truth for both the API and the web app.
 */

/** System languages. */
export const LANGUAGES = ['fr', 'en', 'sw'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Supported display currencies. */
export const CURRENCIES = ['BIF', 'USD'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

/** User roles — Backend Spec §7 + User Roles Spec §2–21. */
export const USER_ROLES = [
  'MAIN_ADMIN',
  'CHIEF',
  'DEPARTMENT_HEAD',
  'PROVINCIAL_ADMIN',
  'COMMUNE_ADMIN',
  'REGIONAL_SUPERVISOR',
  'VERIFICATION_OFFICER',
  'ACCOUNTANT',
  'MODERATOR',
  'SUPPORT_OFFICER',
  'MARKETING_OFFICER',
  'FIELD_AGENT',
  'PROPERTY_OWNER',
  'LANDLORD',
  'BUYER',
  'TENANT',
  'INVESTOR',
  'CLIENT',
  'CUSTOMER',
  'AGENT',
  'GUEST',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Account status — Backend Spec §6 + User Roles Spec §33. */
export const ACCOUNT_STATUSES = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'DISABLED',
  'LOCKED',
  'DELETED',
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/** Permission data-scopes — Backend Spec §9 + User Roles Spec §23. */
export const PERMISSION_SCOPES = [
  'GLOBAL',
  'DEPARTMENT',
  'PROVINCE',
  'COMMUNE',
  'TEAM',
  'OWN',
  'ASSIGNED',
  'PUBLIC',
] as const;
export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

/** Departments — Backend Spec §11. */
export const DEPARTMENTS = [
  'MANAGEMENT',
  'SALES',
  'OPERATIONS',
  'VERIFICATION',
  'RENTALS',
  'CUSTOMER_SUPPORT',
  'ACCOUNTING',
  'MARKETING',
  'TECHNOLOGY',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

/** Geographic hierarchy: Province → Commune → Zone. */
export const ENTITY_STATUS = ['ACTIVE', 'INACTIVE'] as const;
export type EntityStatus = (typeof ENTITY_STATUS)[number];

/** Property types — Backend Spec §16. */
export const PROPERTY_TYPES = [
  'HOUSE',
  'OFFICE',
  'FARM',
  'APARTMENT',
  'SHOP',
  'INDUSTRIAL',
  'VILLA',
  'WAREHOUSE',
  'OTHER',
  'LAND',
  'HOTEL',
  'COMMERCIAL',
  'GUEST_HOUSE',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** Listing types — Backend Spec §17. */
export const LISTING_TYPES = ['SALE', 'AUCTION', 'RENT', 'INVESTMENT', 'LEASE'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

/** Property workflow status — Backend Spec §18. */
export const PROPERTY_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'NEEDS_CORRECTION',
  'PUBLISHED',
  'SOLD',
  'RENTED',
  'ARCHIVED',
  'SUSPENDED',
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

/** Property verification status — Backend Spec §19 + §78 colors. */
export const VERIFICATION_STATUSES = [
  'NOT_VERIFIED',
  'PARTIAL',
  'VERIFIED',
  'FULLY_VERIFIED',
  'EXPIRED',
  'SUSPENDED',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Agent approval status — granted by a main admin from the admin dashboard. */
export const AGENT_VERIFICATION_STATUSES = ['NOT_VERIFIED', 'VERIFIED'] as const;
export type AgentVerificationStatus = (typeof AGENT_VERIFICATION_STATUSES)[number];

/** Property document types — Backend Spec §20. */
export const DOCUMENT_TYPES = [
  'LAND_TITLE',
  'SALE_AGREEMENT',
  'TOP',
  'PROPERTY_TAX',
  'OWNER_ID',
  'OTHER',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** File visibility — Backend Spec §21. */
export const FILE_VISIBILITIES = ['PRIVATE', 'INTERNAL', 'RESTRICTED', 'PUBLIC'] as const;
export type FileVisibility = (typeof FILE_VISIBILITIES)[number];

/** Property media types — Backend Spec §22. */
export const MEDIA_TYPES = ['IMAGE', 'VIDEO', 'FLOOR_PLAN', 'DOCUMENT_PREVIEW'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Verification request status — workflow from Backend Spec §24 + Frontend §46. */
export const VERIFICATION_REQUEST_STATUSES = [
  'PENDING_PAYMENT',
  'PAYMENT_CONFIRMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
] as const;
export type VerificationRequestStatus = (typeof VERIFICATION_REQUEST_STATUSES)[number];

/** Request states that still occupy the review queue (i.e. not yet settled). */
export const OPEN_VERIFICATION_REQUEST_STATUSES = [
  'PENDING_PAYMENT',
  'PAYMENT_CONFIRMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'UNDER_REVIEW',
] as const;

/** Verification result — Backend Spec §25. */
export const VERIFICATION_RESULTS = ['VERIFIED', 'PARTIAL', 'NOT_VERIFIED'] as const;
export type VerificationResult = (typeof VERIFICATION_RESULTS)[number];

/** Individual check status — Backend Spec §25. */
export const CHECK_STATUSES = ['PASSED', 'FAILED', 'PARTIAL', 'NOT_APPLICABLE'] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

/** Share platforms — Backend Spec §33 + Frontend §22. */
export const SHARE_PLATFORMS = [
  'WHATSAPP',
  'FACEBOOK',
  'INSTAGRAM',
  'MESSENGER',
  'EMAIL',
  'COPY_LINK',
  'OTHER',
] as const;
export type SharePlatform = (typeof SHARE_PLATFORMS)[number];

/** Enquiry statuses — Backend Spec §34. */
export const ENQUIRY_STATUSES = [
  'NEW',
  'OPEN',
  'IN_PROGRESS',
  'RESPONDED',
  'DEAL_AGREED',
  'CLOSED',
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/** Payment-link statuses — agent → buyer/tenant checkout flow (Migration §8). */
export const PAYMENT_LINK_STATUSES = [
  'CREATED',
  'SENT',
  'OPENED',
  'PAID',
  'CANCELLED',
  'EXPIRED',
] as const;
export type PaymentLinkStatus = (typeof PAYMENT_LINK_STATUSES)[number];

/** Visit session status — derived from Frontend §30–32. */
export const VISIT_SESSION_STATUSES = ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export type VisitSessionStatus = (typeof VISIT_SESSION_STATUSES)[number];

/** Visit booking statuses — Backend Spec §38. */
export const VISIT_BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
export type VisitBookingStatus = (typeof VISIT_BOOKING_STATUSES)[number];

/** Rental application statuses — Backend Spec §40 + Frontend §29. */
export const RENTAL_APPLICATION_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
] as const;
export type RentalApplicationStatus = (typeof RENTAL_APPLICATION_STATUSES)[number];

/** Promotion order statuses — workflow from Backend Spec §44. */
export const PROMOTION_ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'ACTIVATED',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type PromotionOrderStatus = (typeof PROMOTION_ORDER_STATUSES)[number];

/** Payment categories — Backend Spec §45. */
export const PAYMENT_CATEGORIES = [
  'VERIFICATION',
  'PROMOTION',
  'SALE_COMMISSION',
  'RENTAL_COMMISSION',
  'REFUND',
  'ADJUSTMENT',
  'OTHER',
] as const;
export type PaymentCategory = (typeof PAYMENT_CATEGORIES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Mobile money services live in Burundi. EACO recognises three nationwide
 * operators: Lumitel (Viettel), Econet Leo and iHela.
 */
export const MOBILE_MONEY_PROVIDERS = ['LUMICASH', 'ECOCASH', 'IHELA'] as const;
export type MobileMoneyProvider = (typeof MOBILE_MONEY_PROVIDERS)[number];

/** ISO 3166-1 alpha-2 calling code used for MSISDN normalisation. */
export const DEFAULT_COUNTRY_CALLING_CODE = '257';

/** Financial ledgers stay categorised — Backend Spec §47. */
export const FINANCIAL_ADJUSTMENT_CATEGORIES = [
  'VERIFICATION',
  'PROMOTION',
  'SALES_COMMISSION',
  'RENTAL_COMMISSION',
  'REFUND',
  'OTHER',
] as const;
export type FinancialAdjustmentCategory = (typeof FINANCIAL_ADJUSTMENT_CATEGORIES)[number];

/** Transaction types — Backend Spec §50. */
export const TRANSACTION_TYPES = ['SALE', 'RENTAL', 'LEASE'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const COMPLETION_STATUSES = ['PENDING', 'DUE', 'PAID', 'CANCELLED', 'VOID'] as const;
export type CompletionStatus = (typeof COMPLETION_STATUSES)[number];

/** Refund statuses — Backend Spec §51. */
export const REFUND_STATUSES = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSED'] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

/** Notification channels — Backend Spec §60. */
export const NOTIFICATION_CHANNELS = ['IN_APP', 'WHATSAPP', 'EMAIL', 'PUSH', 'SMS'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_TYPES = [
  'PROPERTY_APPROVED',
  'PROPERTY_REJECTED',
  'PROPERTY_CORRECTION_REQUIRED',
  'VERIFICATION_COMPLETED',
  'PAYMENT_RECEIVED',
  'VISIT_CONFIRMED',
  'VISIT_CANCELLED',
  'RENTAL_APPLICATION_UPDATED',
  'PROMOTION_ACTIVATED',
  'NEW_ENQUIRY',
  'NEW_MESSAGE',
  'FAVORITE_SOLD',
  'FAVORITE_RENTED',
  'FAVORITE_ARCHIVED',
  'PROPERTY_PUBLISHED',
  'NEW_VISIT_BOOKING',
  'NEW_RENTAL_APPLICATION',
  'NEW_PROPERTY_SUBMITTED',
  'NEW_VERIFICATION_REQUEST',
  'SYSTEM',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_STATUSES = ['PENDING', 'SENT', 'FAILED', 'DELIVERED', 'READ'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** Offline sync statuses — Backend Spec §64. */
export const SYNC_STATUSES = ['PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'CONFLICT'] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

/** Contract types — Backend Spec Part 3 §91. */
export const CONTRACT_TYPES = [
  'BROKERAGE',
  'PROMOTION',
  'SALE',
  'AGENT',
  'RENTAL',
  'SERVICE',
  'VERIFICATION',
] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_STATUSES = ['DRAFT', 'ISSUED', 'SIGNED', 'COMPLETED', 'TERMINATED', 'CANCELLED'] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

/** User-report reasons — Frontend §23. */
export const REPORT_REASONS = [
  'WRONG_INFORMATION',
  'FRAUD_SUSPICION',
  'INCORRECT_PRICE',
  'DUPLICATE_LISTING',
  'WRONG_LOCATION',
  'INAPPROPRIATE_CONTENT',
  'ALREADY_SOLD_OR_RENTED',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Staff employment status. */
export const EMPLOYMENT_STATUSES = ['ACTIVE', 'LEAVE', 'SUSPENDED', 'TERMINATED'] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

/** Public map precision control — Frontend §15. */
export const LOCATION_PRECISIONS = ['EXACT', 'APPROXIMATE', 'HIDDEN'] as const;
export type LocationPrecision = (typeof LOCATION_PRECISIONS)[number];

/** OTP purposes (Phase 1 stubs). */
export const OTP_PURPOSES = ['PHONE_VERIFICATION', 'EMAIL_VERIFICATION', 'LOGIN', 'PASSWORD_RESET'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

/**
 * Backend-generated business codes (immutable, globally unique).
 * Verified property IDs / VER / PRO / COMS / COMR / VIS / agent codes.
 */
export const CODE_PREFIXES = {
  PROPERTY: 'BDI',
  VERIFICATION: 'VER',
  PROMOTION: 'PRO',
  SALES_COMMISSION: 'COMS',
  RENTAL_COMMISSION: 'COMR',
  VISIT_BOOKING: 'VIS',
  TRANSACTION: 'TXN',
  REFUND: 'RFD',
  AGENT: 'AG',
  STAFF: 'STF',
  CONTRACT: 'CTR',
} as const;

export interface ApiErrorPayload {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}