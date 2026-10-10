import axios, { AxiosError, AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type {
  AdminAgentDTO,
  AdminAgentStatusBody,
  AdminAgentVerificationBody,
  AdminBookingDTO,
  AdminCreateAgentBody,
  AdminDashboardSummary,
  AdminListQuery,
  AdminPropertyDTO,
  AdminPropertyReviewBody,
  AdminPropertyVerificationBody,
  AdminRequestDTO,
  AccountSetupDTO,
  AgentPropertyDTO,
  AgentSummary,
  AgentVerificationPortfolioDTO,
  ApiErrorPayload,
  ApiResponseEnvelope,
  CurrencyCode,
  Language,
  LoginBody,
  PropertySearchQuery,
  PropertySummaryDTO,
  PublicPropertyDTO,
  RegisterBody,
  UserPublicDTO,
} from '@immo/shared-types';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStore';
import { API_BASE_URL, resolveAssetUrl } from './runtime';

export class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: UserPublicDTO;
}

export interface PopularLocation {
  provinceId: string;
  code: string;
  name: string;
  count: number;
}

export interface VisitSession {
  _id: string;
  propertyId: string;
  date: string;
  startTime: string;
  endTime?: string;
  capacity: number;
  bookedCount: number;
  capacityRemaining: number;
  isFull: boolean;
  bookingDeadline: string;
  timezone?: string;
  status?: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
  /** Entity references so the feed can deep-link (propertyId, conversationId, ...). */
  data?: Record<string, unknown> | null;
}

export interface EnquiryInput {
  propertyId?: string;
  agentId?: string;
  subject: string;
  message: string;
  preferredContact?: 'PHONE' | 'WHATSAPP' | 'EMAIL';
}

export interface RentalApplicationInput {
  propertyId: string;
  message?: string;
  monthlyIncome?: number;
  employmentStatus?: string;
  references?: string;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  preferredLanguage?: Language;
  preferredCurrency?: CurrencyCode;
  password?: string;
  currentPassword?: string;
}

export interface UploadedFile {
  url: string;
  uuid: string;
  mimeType: string;
  size: number;
}

/* ── Bare client (used only for the refresh call) ──────────── */
const bare = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

/* ── Main client with auth + refresh interceptor ───────────── */
const client: AxiosInstance = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

let refreshPromise: Promise<string | null> | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setUnauthorizedHandler(cb: () => void): void {
  onUnauthorizedCallback = cb;
}

function getErrorPayload(err: AxiosError): ApiErrorPayload | undefined {
  return (err.response?.data as ApiResponseEnvelope<never> | undefined)?.error;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return null;
    }
    try {
      const res = await bare.post<ApiResponseEnvelope<AuthTokens>>('/auth/refresh', { refreshToken });
      const data = res.data.data;
      if (!data?.accessToken || !data?.refreshToken) throw new Error('Missing tokens in refresh response');
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      clearTokens();
      onUnauthorizedCallback?.();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export { refreshAccessToken };

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original) return Promise.reject(error);

    const isNotFound = error.response?.status === 404;
    const payload = getErrorPayload(error);
    const isExpired = error.response?.status === 401 && payload?.code === 'TOKEN_EXPIRED';

    if (isExpired && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = {
          ...(original.headers as Record<string, string>),
          Authorization: `Bearer ${newToken}`,
        };
        return client(original);
      }
    }

    if (isNotFound && payload?.code === 'NOT_FOUND') {
      onUnauthorizedCallback?.(); /* session lost, surface it */
    }

    return Promise.reject(error);
  },
);

async function unwrap<T>(promise: Promise<AxiosResponse<ApiResponseEnvelope<T>>>): Promise<T> {
  const res = await promise;
  const body = res.data;
  if (!body.success) {
    throw new ApiClientError(res.status, body.error?.code ?? 'UNKNOWN', body.error?.message ?? 'Unknown error');
  }
  return body.data as T;
}

/**
 * Paginated endpoints respond with `data` = items array and `meta` as a
 * sibling envelope field. Normalize both into the `Paginated<T>` shape.
 */
async function getList<T>(url: string, params?: Record<string, unknown>): Promise<Paginated<T>> {
  const res = await client.get<ApiResponseEnvelope<T[]>>(url, { params: params as Record<string, unknown> });
  const body = res.data;
  if (!body.success) {
    throw new ApiClientError(res.status, body.error?.code ?? 'UNKNOWN', body.error?.message ?? 'Unknown error');
  }
  const items = body.data ?? ([] as unknown as T[]);
  const meta = body.meta as PaginationMeta | undefined;
  return {
    items,
    meta: meta ?? { page: 1, pageSize: items.length, total: items.length, totalPages: 1 },
  };
}

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  if (axios.isAxiosError(err)) {
    const payload = getErrorPayload(err);
    if (payload?.message) return payload.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) => unwrap<T>(client.get(url, { params })),
  post: <T>(url: string, data?: unknown) => unwrap<T>(client.post(url, data)),
  patch: <T>(url: string, data?: unknown) => unwrap<T>(client.patch(url, data)),
  delete: <T>(url: string) => unwrap<T>(client.delete(url)),
};

/* ── Typed endpoint helpers ─────────────────────────────────── */

export const propertiesApi = {
  search: (query: PropertySearchQuery = {}) =>
    getList<PropertySummaryDTO>('/properties', { ...query } as Record<string, unknown>),
  getOne: (id: string) => api.get<PublicPropertyDTO>(`/properties/${id}`),
  create: (body: Record<string, unknown>) => api.post<PropertySummaryDTO>('/properties', body),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<PropertySummaryDTO>(`/properties/${id}`, body),
  analytics: (id: string) => api.get<AgentPropertyDTO>(`/properties/${id}/analytics`),
  getFeatured: (limit = 12) =>
    api.get<PropertySummaryDTO[]>('/properties/featured', { limit }),
  getRecent: (limit = 12) =>
    api.get<PropertySummaryDTO[]>('/properties/recent', { limit }),
  getVerified: (limit = 20) =>
    api.get<PropertySummaryDTO[]>('/properties/verified', { limit }),
  getPopularLocations: (limit = 12) =>
    api.get<PopularLocation[]>('/properties/popular-locations', { limit }),
  getRelated: (id: string, limit = 12) =>
    api.get<PropertySummaryDTO[]>(`/properties/${id}/related`, { limit }),
  toggleFavorite: (id: string) => api.post<{ favorite: boolean }>(`/properties/${id}/favorite`),
};

export interface AgentPropertyQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  listingType?: string;
  sortBy?: 'created' | 'views' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export const agentPropertiesApi = {
  list: (params: AgentPropertyQuery = {}) =>
    getList<AgentPropertyDTO>('/agent/properties', { ...params } as Record<string, unknown>),
  get: (id: string) => api.get<AgentPropertyDTO>(`/agent/properties/${id}`),
  update: (id: string, body: Record<string, unknown>) =>
    api.patch<AgentPropertyDTO>(`/agent/properties/${id}`, body),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/agent/properties/${id}`),
  analytics: (id: string) => api.get<Record<string, unknown>>(`/agent/properties/${id}/analytics`),
  transition: (id: string, action: string, body: Record<string, unknown> = {}) =>
    api.post<AgentPropertyDTO>(`/properties/${id}/${action}`, body),
};

export const favoritesApi = {
  list: (page = 1, pageSize = 20) => getList<PropertySummaryDTO>('/favorites', { page, pageSize }),
  add: (propertyId: string) => api.post<{ favorite: boolean }>('/favorites', { propertyId }),
  remove: (propertyId: string) => api.delete<{ removed: boolean }>(`/favorites/${propertyId}`),
};

export const authApi = {
  login: (body: LoginBody) => api.post<AuthResult>('/auth/login', body),
  register: (body: RegisterBody & { confirmPassword?: string }) =>
    api.post<AuthResult>('/auth/register', body),
  getSetupAccount: (token: string) => api.get<AccountSetupDTO>(`/auth/setup/${encodeURIComponent(token)}`),
  activateAccount: (token: string, password: string) =>
    api.post<AuthResult>(`/auth/setup/${encodeURIComponent(token)}`, { password }),
  googleLogin: (accessToken: string, role?: string) =>
    api.post<AuthResult>('/auth/google', { accessToken, role }),
  logout: (refreshToken: string | null) =>
    api.post<{ loggedOut: boolean }>('/auth/logout', { refreshToken }),
  me: () => api.get<UserPublicDTO>('/auth/me'),
};

export interface AgentListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  province?: string;
  topAgent?: boolean;
}

export const agentsApi = {
  list: (params: AgentListQuery = {}) =>
    getList<AgentSummary>('/agents', { ...params } as Record<string, unknown>),
  get: (id: string) => api.get<AgentSummary>(`/agents/${id}`),
  me: () => api.get<AgentSummary | null>('/agents/me'),
};

export const adminApi = {
  summary: (params: { periodDays?: number } = {}) =>
    api.get<AdminDashboardSummary>('/admin/dashboard/summary', params as Record<string, unknown>),
  agents: (params: AdminListQuery = {}) =>
    getList<AdminAgentDTO>('/admin/agents', { ...params } as Record<string, unknown>),
  createAgent: (body: AdminCreateAgentBody) => api.post<AdminAgentDTO>('/admin/agents', body),
  setAgentStatus: (id: string, body: AdminAgentStatusBody) =>
    api.patch<AdminAgentDTO>(`/admin/agents/${id}/status`, body),
  setAgentVerification: (id: string, body: AdminAgentVerificationBody) =>
    api.patch<AdminAgentDTO>(`/admin/agents/${id}/verification`, body),
  properties: (params: AdminListQuery = {}) =>
    getList<AdminPropertyDTO>('/admin/properties', { ...params } as Record<string, unknown>),
  reviewProperty: (id: string, action: 'approve' | 'reject' | 'request-correction', body: AdminPropertyReviewBody) =>
    api.post<AdminPropertyDTO>(`/admin/properties/${id}/${action}`, body),
  blockProperty: (id: string, body: AdminPropertyReviewBody) =>
    api.post<AdminPropertyDTO>(`/admin/properties/${id}/block`, body),
  unblockProperty: (id: string, body: AdminPropertyReviewBody = {}) =>
    api.post<AdminPropertyDTO>(`/admin/properties/${id}/unblock`, body),
  setPropertyVerification: (id: string, body: AdminPropertyVerificationBody) =>
    api.patch<AdminPropertyDTO>(`/admin/properties/${id}/verification`, body),
  bookings: (params: AdminListQuery = {}) =>
    getList<AdminBookingDTO>('/admin/bookings', { ...params } as Record<string, unknown>),
  setBookingStatus: (id: string, status: string) =>
    api.patch<AdminBookingDTO>(`/admin/bookings/${id}/status`, { status }),
  requests: (params: AdminListQuery = {}) =>
    getList<AdminRequestDTO>('/admin/requests', { ...params } as Record<string, unknown>),
  setRequestStatus: (id: string, status: string) =>
    api.patch<AdminRequestDTO>(`/admin/requests/${id}/status`, { status }),
};

export const geoApi = {
  getProvinces: () => api.get<Array<{ _id: string; code: string; name: string }>>('/geo/provinces'),
  getCommunes: (provinceId: string) =>
    api.get<Array<{ _id: string; code: string; name: string }>>(`/geo/provinces/${provinceId}/communes`),
  getExchangeRates: () => api.get<Array<{ fromCurrency: string; toCurrency: string; rate: number; rateDate: string }>>('/geo/exchange-rates'),
};

export const visitsApi = {
  getSessions: (propertyId: string) => api.get<VisitSession[]>(`/visits/sessions/property/${propertyId}`),
  book: (visitSessionId: string, numberOfPeople = 1, notes?: string) =>
    api.post<{ bookingReference: string; status: string }>('/visits/book', {
      visitSessionId,
      numberOfPeople,
      notes,
    }),
  bookAnyTime: (propertyId: string, details: { preferredDate?: string; startTime?: string; numberOfPeople?: number; notes?: string }) =>
    api.post<{ bookingReference: string; status: string }>('/visits/book', {
      propertyId,
      ...details,
    }),
  getMyBookings: () => getList<Record<string, unknown>>('/visits/bookings/my', { page: 1, pageSize: 50 }),
  getPropertyBookings: (propertyId: string) =>
    getList<Record<string, unknown>>(`/visits/bookings/property/${propertyId}`, { page: 1, pageSize: 50 }),
  updateBookingStatus: (id: string, status: string) =>
    api.patch<{ status: string }>(`/visits/bookings/${id}/status`, { status }),
};

export const enquiriesApi = {
  create: (data: EnquiryInput) => api.post<Record<string, unknown>>('/enquiries', data),
  getMine: () => getList<Record<string, unknown>>('/enquiries', { page: 1, pageSize: 50 }),
  inbox: () => api.get<Array<Record<string, unknown>>>('/enquiries/inbox'),
  setStatus: (id: string, status: string) =>
    api.patch<Record<string, unknown>>(`/enquiries/${id}/status`, { status }),
};

export const dealsApi = {
  /* Deals are settled manually: the agent confirms the money was received and
     the API records the payment and takes the property off the market. */
  markPaid: (body: { kind: 'booking' | 'enquiry'; id: string }) =>
    api.post<{
      paymentReference: string;
      amount: number;
      currency: string;
      paidAt: string;
      propertyMarkedSold: boolean;
    }>('/deals/mark-paid', body),
};

export const rentalApplicationsApi = {
  create: (data: RentalApplicationInput) => api.post<Record<string, unknown>>('/rental-applications', data),
  getMine: () => getList<Record<string, unknown>>('/rental-applications/my', { page: 1, pageSize: 50 }),
};

export const notificationsApi = {
  list: () => getList<NotificationItem>('/notifications', { page: 1, pageSize: 50 }),
  unreadCount: () => api.get<{ unread: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<Record<string, unknown>>(`/notifications/${id}/read`),
  markAllRead: () => api.post<Record<string, unknown>>('/notifications/read-all'),
};

export const verificationApi = {
  listRequests: (params: { page?: number; pageSize?: number; status?: string } = {}) =>
    getList<Record<string, unknown>>('/verification/requests', { page: 1, pageSize: 50, ...params } as Record<string, unknown>),
  /**
   * Agent dashboard: every property the agent manages with the admin's verdict,
   * the request in flight, and the outstanding requirements. Not paginated —
   * the whole portfolio is small enough to render in one go.
   */
  portfolio: () => api.get<AgentVerificationPortfolioDTO>('/verification/portfolio'),
  createRequest: (propertyId: string, notes?: string) =>
    api.post<Record<string, unknown>>('/verification/requests', { propertyId, notes }),
  complete: (
    id: string,
    body: { result: 'VERIFIED' | 'PARTIAL' | 'NOT_VERIFIED'; reason?: string; notes?: string; level?: string },
  ) => api.patch<{ request: Record<string, unknown>; verificationStatus: string }>(`/verification/requests/${id}/complete`, body),
};

export const messagesApi = {
  listConversations: () => api.get<Array<Record<string, unknown>>>('/messages/conversations'),
};

export const reportsApi = {
  create: (data: { resourceType: string; resourceId: string; reason: string; description?: string }) =>
    api.post<Record<string, unknown>>('/reports', data),
};

export const filesApi = {
  /**
   * JPEG/PNG/WEBP/GIF, 5 MB max. The API returns a backend-relative
   * `/uploads/...` path; it is absolutised here so the value stays loadable
   * once it is persisted on a user or property document.
   */
  uploadImage: async (file: Blob, fileName: string) => {
    const fd = new FormData();
    fd.append('file', file, fileName);
    const uploaded = await unwrap<UploadedFile>(client.post('/files/upload', fd));
    return { ...uploaded, url: resolveAssetUrl(uploaded.url) };
  },
};

export const usersApi = {
  me: () => api.get<UserPublicDTO>('/users/me'),
  update: (userId: string, data: UserProfileUpdate) => api.patch<UserPublicDTO>(`/users/${userId}`, data),
  uploadProfilePhoto: (file: Blob, fileName: string) => filesApi.uploadImage(file, fileName),
  getRecentViews: () =>
    getList<PropertySummaryDTO>('/users/me/recent-views', { page: 1, pageSize: 50 }).catch(() => ({
      items: [],
      meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
    })),
};

export { client };