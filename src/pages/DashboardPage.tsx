import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, CalendarDays, MessageCircle } from 'lucide-react';
import type { AgentSummary, PropertySummaryDTO } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { favoritesApi, enquiriesApi, propertiesApi, rentalApplicationsApi, usersApi, visitsApi } from '../lib/api';
import { useAsyncData } from '../lib/useAsyncData';
import { useScrollToTop } from '../lib/useScrollToTop';
import PropertyCard from '../components/PropertyCard';
import PropertyCardSkeleton from '../components/PropertyCardSkeleton';
import VisitCard from '../components/VisitCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ContactAgentModal from '../components/ContactAgentModal';
import { timeAgo } from '../lib/format';
import { tabIdsForRole, defaultTabForRole, NOTIFICATION_TAB_ID } from '../components/layout/accountTabs';
import { isAgentRole, isMainAdminRole } from '../lib/roles';
import AgentHomeTab from './dashboard/AgentHomeTab';
import MyPropertiesTab from './dashboard/MyPropertiesTab';
import AgentVerificationTab from './dashboard/AgentVerificationTab';
import AnalyticsTab from './dashboard/AnalyticsTab';
import BookingsInquiriesTab from './dashboard/BookingsInquiriesTab';
import NotificationsTab from './dashboard/NotificationsTab';
import AdminDashboard from './dashboard/AdminDashboard';

type BookingRow = Record<string, unknown>;

const emptyPage = <T,>(): Promise<{ items: T[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }> =>
  Promise.resolve({ items: [], meta: { page: 1, pageSize: 1, total: 0, totalPages: 0 } });

/** Header title per customer tab — never a generic "dashboard" / "my bookings" heading. */
const CUSTOMER_TAB_TITLES: Record<string, string> = {
  favorites: 'dashboard.favorites',
  recentViews: 'dashboard.recentViews',
  visits: 'dashboard.visits',
  applications: 'dashboard.applications',
  [NOTIFICATION_TAB_ID]: 'dashboard.notifications',
};

interface RequestRow {
  id: string;
  kind: 'BUY' | 'RENT';
  status: string;
  message: string;
  title: string;
  photo: string;
  propertyId: string;
  createdAt: string;
  /** Present for buy requests, which ship the agent with the enquiry. */
  agent: AgentSummary | null;
}

/** Flattens `agentId.userId` from a buy enquiry into the shared `AgentSummary` shape. */
function toAgentSummary(ref: unknown): AgentSummary | null {
  const agent: any = ref && typeof ref === 'object' ? ref : null;
  const user: any = agent?.userId && typeof agent.userId === 'object' ? agent.userId : null;
  if (!agent || !user) return null;
  return {
    id: String(agent._id ?? ''),
    agentCode: String(agent.agentCode ?? ''),
    firstName: String(user.firstName ?? ''),
    lastName: String(user.lastName ?? ''),
    photoUrl: user.photoUrl ? String(user.photoUrl) : undefined,
    agencyName: agent.agencyName ? String(agent.agencyName) : undefined,
    topAgent: Boolean(agent.topAgent),
    phone: user.phone ? String(user.phone) : undefined,
    email: user.email ? String(user.email) : undefined,
  };
}

/**
 * "My applications" mixes two backends: buy requests are `Enquiry` rows and rental
 * applications are `RentalApplication` rows. Both populate `propertyId`, so normalise
 * them into one shape for the list.
 */
function toRequestRow(item: Record<string, unknown>, kind: 'BUY' | 'RENT'): RequestRow | null {
  const ref: any = item.propertyId;
  const prop = ref && typeof ref === 'object' ? ref : null;
  const propertyId = String(prop?._id ?? (typeof ref === 'string' ? ref : ''));
  if (!propertyId) return null;
  const media: any[] = Array.isArray(prop?.media) ? prop.media : [];
  return {
    id: String(item._id ?? ''),
    kind,
    status: String(item.status ?? (kind === 'BUY' ? 'NEW' : 'SUBMITTED')),
    message: String(item.message ?? ''),
    title: String(prop?.title ?? ''),
    photo: String(media[0]?.thumbUrl ?? media[0]?.url ?? ''),
    propertyId,
    createdAt: String(item.createdAt ?? ''),
    agent: toAgentSummary(item.agentId),
  };
}

function Grid({ items, emptyTitle, emptyDesc }: { items: PropertySummaryDTO[]; emptyTitle: string; emptyDesc: string }): JSX.Element {
  if (items.length === 0) {
    return <EmptyState illustration="/no_content_illustration_v4.svg" title={emptyTitle} description={emptyDesc} />;
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-3">
      {items.map((p) => (
        <PropertyCard key={p._id} property={p} />
      ))}
    </div>
  );
}

export default function DashboardPage(): JSX.Element {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAgent = isAgentRole(user?.role);
  const isMainAdmin = isMainAdminRole(user?.role);

  const validIds = tabIdsForRole(isAgent, isMainAdmin);
  const requested = searchParams.get('tab');
  const initialTab =
    requested === NOTIFICATION_TAB_ID ? NOTIFICATION_TAB_ID : requested && validIds.includes(requested) ? requested : defaultTabForRole(isAgent, isMainAdmin);
  const [tab, setTab] = useState<string>(initialTab);

  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const next = validIds.includes(urlTab ?? '') ? (urlTab as string) : urlTab === NOTIFICATION_TAB_ID ? NOTIFICATION_TAB_ID : defaultTabForRole(isAgent, isMainAdmin);
    if ((validIds as readonly string[]).includes(tab) || tab === NOTIFICATION_TAB_ID) {
      if (next && next !== tab) setTab(next);
    }
    /* A tab that no longer exists for this role (retired page, old bookmark) leaves a
       misleading ?tab= in the address bar — rewrite it so the URL matches what's shown.
       Main admins are excluded: AdminDashboard owns its own wider tab vocabulary. */
    if (!isMainAdmin && urlTab && !(validIds as readonly string[]).includes(urlTab) && urlTab !== NOTIFICATION_TAB_ID) {
      const cleaned = new URLSearchParams(searchParams);
      cleaned.delete('tab');
      setSearchParams(cleaned, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAgent, isMainAdmin]);

  useEffect(() => {
    if (!validIds.includes(tab) && tab !== NOTIFICATION_TAB_ID) setTab(defaultTabForRole(isAgent, isMainAdmin));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgent, isMainAdmin]);

  /* Each tab is a fresh page of content; landing mid-way down the previous one is disorienting. */
  useScrollToTop([tab]);

  /* ── customer data ─────────────────────────────────────── */
  const favorites = useAsyncData(() => (isMainAdmin ? emptyPage<PropertySummaryDTO>() : favoritesApi.list(1, 24)), [isMainAdmin]);
  const recentViews = useAsyncData(() => (isMainAdmin ? emptyPage<PropertySummaryDTO>() : usersApi.getRecentViews()), [isMainAdmin]);
  const applications = useAsyncData(() => (isMainAdmin ? emptyPage<Record<string, unknown>>() : rentalApplicationsApi.getMine()), [isMainAdmin]);
  const buyRequests = useAsyncData(() => (isMainAdmin ? emptyPage<Record<string, unknown>>() : enquiriesApi.getMine()), [isMainAdmin]);

  /* Newest first across both request kinds. */
  const requestRows = useMemo(() => {
    const rows = [
      ...(applications.data?.items ?? []).map((i) => toRequestRow(i, 'RENT')),
      ...(buyRequests.data?.items ?? []).map((i) => toRequestRow(i, 'BUY')),
    ].filter((r): r is RequestRow => r !== null);
    return rows.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  }, [applications.data, buyRequests.data]);
  const visits = useAsyncData(() => (isMainAdmin ? emptyPage<BookingRow>() : visitsApi.getMyBookings()), [isMainAdmin]);

  /* Buy requests already carry the agent; rental rows need the property fetched lazily. */
  const [contactTarget, setContactTarget] = useState<{ agent: AgentSummary | null; propertyTitle: string } | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  const openRequestContact = async (row: RequestRow) => {
    setContactTarget({ agent: row.agent, propertyTitle: row.title });
    if (row.agent) return;
    setContactLoading(true);
    try {
      const property = await propertiesApi.getOne(row.propertyId);
      setContactTarget({ agent: property.agent ?? null, propertyTitle: property.title || row.title });
    } catch {
      /* keep the modal open without an agent — it still explains what to do */
    } finally {
      setContactLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-sm text-gray-500">{t('visit.loginToBook')}</p>
        <button type="button" onClick={() => navigate('/login')} className="btn-primary mt-4">
          {t('nav.login')}
        </button>
      </div>
    );
  }

  if (isMainAdmin) return <AdminDashboard />;

  const renderCustomer = () => {
    if (tab === 'favorites') {
      return favorites.loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-3">
          <PropertyCardSkeleton count={3} />
        </div>
      ) : favorites.error ? (
        <ErrorState title={t('error.loadFailed')} message={favorites.error} onRetry={favorites.reload} retryLabel={t('error.retry')} />
      ) : (
        <Grid items={favorites.data?.items ?? []} emptyTitle={t('empty.noFavorites')} emptyDesc={t('empty.noFavoritesDesc')} />
      );
    }
    if (tab === 'recentViews') {
      return recentViews.loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-3">
          <PropertyCardSkeleton count={3} />
        </div>
      ) : (
        <Grid items={recentViews.data?.items ?? []} emptyTitle={t('empty.noRecentViews')} emptyDesc={t('empty.noRecentViewsDesc')} />
      );
    }
    if (tab === 'visits') {
      return visits.loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-3">
          <PropertyCardSkeleton count={3} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 desktop:grid-cols-3">
          {visits.data?.items.length === 0 ? (
            <div className="col-span-full">
              <EmptyState illustration="/no_content_illustration_v4.svg" title={t('empty.noVisits')} description={t('empty.noVisitsDesc')} />
            </div>
          ) : (
            visits.data?.items.map((item) => (
              <VisitCard key={String((item as BookingRow)._id ?? '')} booking={item as BookingRow} onChanged={visits.reload} />
            ))
          )}
        </div>
      );
    }
    if (tab === 'applications') {
      return applications.loading || buyRequests.loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div>
      ) : requestRows.length === 0 ? (
        <ul className="space-y-3">
          <li>
            <EmptyState illustration="/no_content_illustration_v4.svg" title={t('empty.noApplications')} description={t('empty.noApplicationsDesc')} />
          </li>
        </ul>
      ) : (
        <ul className="space-y-3">
          {requestRows.map((row) => (
            <li key={`${row.kind}-${row.id}`} className="relative flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <button
                type="button"
                onClick={() => void openRequestContact(row)}
                className="absolute inset-0 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                aria-label={t('contact.chatTitle')}
              />
              {row.photo ? (
                <img src={row.photo} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                  <Building2 className="h-6 w-6" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      row.kind === 'BUY' ? 'bg-brand-50 text-brand-700' : 'bg-accent/20 text-gray-800'
                    }`}
                  >
                    {row.kind === 'BUY' ? t('applications.buyRequest') : t('applications.rentApplication')}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{row.status}</span>
                </p>
                <Link
                  to={`/property/${row.propertyId}`}
                  className="relative z-10 mt-1 block truncate text-body font-semibold text-gray-900 hover:underline"
                >
                  {row.title || t('dashboard.property')}
                </Link>
                {row.message ? <p className="truncate text-[13px] text-gray-500">{row.message}</p> : null}
              </div>
              <span className="relative z-10 flex shrink-0 items-center gap-2">
                <span className="text-xs text-gray-400">{timeAgo(row.createdAt)}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </li>
          ))}
        </ul>
      );
    }
    return null;
  };

  const page = (
    <div className={`mx-auto w-full px-4 py-6 lg:py-8 ${isAgent ? '' : 'max-w-5xl'}`}>
      {tab === 'home' ? (
        <AgentHomeTab />
      ) : tab === 'myProperties' ? (
        <MyPropertiesTab />
      ) : tab === 'verification' ? (
        <AgentVerificationTab />
      ) : tab === 'analytics' ? (
        <AnalyticsTab />
      ) : tab === 'bookings' ? (
        <BookingsInquiriesTab />
      ) : tab === NOTIFICATION_TAB_ID ? (
        <NotificationsTab />
      ) : !isAgent ? (
        <>
          <h1 className="page-title mb-6">{t(CUSTOMER_TAB_TITLES[tab] ?? 'dashboard.title')}</h1>
          {renderCustomer()}
        </>
      ) : null}

      {/* Request card click — talk to the agent directly (phone + WhatsApp). */}
      <ContactAgentModal
        open={Boolean(contactTarget)}
        onClose={() => setContactTarget(null)}
        agent={contactTarget?.agent ?? undefined}
        propertyTitle={contactTarget?.propertyTitle || undefined}
        note={contactLoading ? t('common.loading') : undefined}
      />
    </div>
  );

  return page;
}