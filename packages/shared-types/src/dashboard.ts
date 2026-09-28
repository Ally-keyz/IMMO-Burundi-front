import type {
  AccountStatus,
  AgentVerificationStatus,
  CurrencyCode,
  EnquiryStatus,
  PropertyStatus,
  UserRole,
  VerificationStatus,
  VisitBookingStatus,
} from './enums.js';
import type { AdminPropertyDTO } from './dto.js';

export interface AdminAgentDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: AccountStatus;
  agentStatus: string;
  verificationStatus: AgentVerificationStatus;
  verifiedAt?: string;
  statusReason?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  agentCode?: string;
  agencyName?: string;
  licenseNumber?: string;
  province?: { _id: string; code: string; name: string };
  totalProperties: number;
  totalSales: number;
  totalDeals: number;
  setupEmailSent?: boolean;
  setupUrl?: string;
  createdAt: string;
}

export interface AdminPropertyRow extends AdminPropertyDTO {
  reviewNote?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
}

export interface AdminBookingDTO {
  id: string;
  bookingReference: string;
  status: VisitBookingStatus;
  preferredDate?: string;
  startTime?: string;
  numberOfPeople: number;
  notes?: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; phone?: string; email?: string };
  property?: { id: string; propertyId: string; title: string; listingType?: string; media?: Array<{ url?: string; thumbUrl?: string }> };
  agent?: { id: string; firstName: string; lastName: string };
  session?: { id: string; date: string; startTime: string; endTime: string; capacity: number; bookedCount: number };
}

export interface AdminRequestDTO {
  id: string;
  subject?: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; phone?: string; email?: string };
  property: { id: string; propertyId: string; title: string; price?: { amount: number; currency: CurrencyCode }; media?: Array<{ url?: string; thumbUrl?: string }> };
  agent?: { id: string; firstName: string; lastName: string };
}

export interface AdminTrendPoint {
  date: string;
  views: number;
  enquiries: number;
  bookings: number;
}

export interface AdminBreakdownItem {
  label: string;
  value: number;
}

export interface AdminFinanceCurrencyDTO {
  currency: CurrencyCode;
  payments: number;
  commissions: number;
  refunds: number;
}

/**
 * Work waiting on an administrator, one figure per dashboard tab. Drives the
 * rail badges, so every number must be a queue someone has to act on - never a
 * lifetime total. `total` is the platform-wide backlog shown on Overview.
 */
export interface AdminPendingCounts {
  agents: number;
  properties: number;
  bookings: number;
  requests: number;
  verification: number;
  total: number;
}

export interface AdminDashboardSummary {
  generatedAt: string;
  periodDays: number;
  totals: {
    users: number;
    activeUsers: number;
    agents: number;
    activeAgents: number;
    properties: number;
    publishedProperties: number;
    underReviewProperties: number;
    bookings: number;
    saleRequests: number;
    views: number;
  };
  pending: AdminPendingCounts;
  trend: AdminTrendPoint[];
  propertyStatus: AdminBreakdownItem[];
  agentStatus: AdminBreakdownItem[];
  finance: AdminFinanceCurrencyDTO[];
  topAgents: AdminAgentDTO[];
  recentProperties: AdminPropertyRow[];
}

export interface AdminListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  agentId?: string;
  propertyId?: string;
  listingType?: string;
}

export interface AdminCreateAgentBody {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: Extract<UserRole, 'AGENT' | 'FIELD_AGENT'>;
  agencyName?: string;
  licenseNumber?: string;
  provinceId?: string;
}

export interface AdminAgentStatusBody {
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  reason?: string;
}

export interface AdminAgentVerificationBody {
  status: AgentVerificationStatus;
  note?: string;
  /** Required by the API when the agent is not verified. */
  reason?: string;
}

export interface AdminPropertyReviewBody {
  note?: string;
  reason?: string;
}

export interface AdminPropertyVerificationBody {
  status: Extract<VerificationStatus, 'NOT_VERIFIED' | 'PARTIAL' | 'VERIFIED' | 'FULLY_VERIFIED'>;
  note?: string;
}
