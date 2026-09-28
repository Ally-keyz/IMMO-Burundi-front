import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Eye,
  FileCheck2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type {
  AdminAgentDTO,
  AdminBookingDTO,
  AdminCreateAgentBody,
  AdminDashboardSummary,
  AdminPropertyDTO,
  AdminPropertyReviewBody,
  AdminRequestDTO,
} from '@immo/shared-types';
import { adminApi, geoApi, getApiErrorMessage } from '../../lib/api';
import { formatCompact, formatDate, formatNumber } from '../../lib/format';
import { invalidateRailCounts } from '../../lib/railCounts';
import { useScrollToTop } from '../../lib/useScrollToTop';
import { ADMIN_TAB_IDS, type AdminTabId } from '../../components/layout/accountTabs';
import Modal from '../../components/Modal';
import AdminVerificationSection from './AdminVerificationSection';

type AdminTab = AdminTabId;
type ReviewAction = 'approve' | 'reject' | 'request-correction' | 'block' | 'unblock';

interface ProvinceOption {
  _id: string;
  name: string;
}

const inputClass = 'h-10 w-full rounded-xl border border-gray-200 bg-surface px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500';

const PROPERTY_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION', 'PUBLISHED', 'SOLD', 'RENTED', 'ARCHIVED', 'SUSPENDED'];
const AGENT_STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE'];
const BLOCKABLE_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION', 'PUBLISHED'];
const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const REQUEST_STATUSES = ['NEW', 'OPEN', 'IN_PROGRESS', 'RESPONDED', 'DEAL_AGREED', 'CLOSED'];

const REVIEW_TITLES: Record<ReviewAction, string> = {
  approve: 'Approve property',
  reject: 'Reject property',
  'request-correction': 'Request correction',
  block: 'Block property',
  unblock: 'Unblock property',
};
const REVIEW_REASON_ACTIONS: ReviewAction[] = ['reject', 'block'];
const REVIEW_DANGER_ACTIONS: ReviewAction[] = ['reject', 'block'];

function statusClass(value: string): string {
  if (['ACTIVE', 'PUBLISHED', 'APPROVED', 'CONFIRMED', 'RESPONDED', 'DEAL_AGREED', 'COMPLETED'].includes(value)) return 'bg-verified/10 text-verified';
  if (['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'OPEN', 'IN_PROGRESS', 'NEEDS_CORRECTION'].includes(value)) return 'bg-accent/30 text-gray-800';
  if (['REJECTED', 'SUSPENDED', 'CANCELLED', 'NO_SHOW', 'DISABLED'].includes(value)) return 'bg-notVerified/10 text-notVerified';
  return 'bg-gray-100 text-gray-600';
}

function verificationClass(status: string): string {
  if (status === 'VERIFIED' || status === 'FULLY_VERIFIED') return 'bg-verified/10 text-verified';
  if (status === 'PARTIAL') return 'bg-partial/10 text-partial';
  if (status === 'EXPIRED' || status === 'SUSPENDED') return 'bg-notVerified/10 text-notVerified';
  return 'bg-gray-100 text-gray-500';
}

function initials(value: { firstName?: string; lastName?: string }): string {
  return `${value.firstName?.[0] ?? ''}${value.lastName?.[0] ?? ''}`.toUpperCase() || '—';
}

function linePath(values: number[], width: number, height: number, left: number, right: number, top: number, bottom: number): string {
  const max = Math.max(1, ...values);
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  return values
    .map((value, index) => {
      const x = left + (values.length <= 1 ? 0 : (index / (values.length - 1)) * plotWidth);
      const y = top + plotHeight - (value / max) * plotHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function TrendChart({ data }: { data: AdminDashboardSummary['trend'] }): JSX.Element {
  const width = 760;
  const height = 260;
  const left = 42;
  const right = 16;
  const top = 18;
  const bottom = 34;
  const values = data.flatMap((point) => [point.views, point.enquiries, point.bookings]);
  const max = Math.max(1, ...values);
  const series = [
    { key: 'views' as const, color: '#0057ff' },
    { key: 'enquiries' as const, color: '#e6b200' },
    { key: 'bookings' as const, color: '#16a34a' },
  ];
  const y = (value: number) => top + (height - top - bottom) - (value / max) * (height - top - bottom);
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="overflow-hidden">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-500">
        {series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5 capitalize">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.key}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full" role="img" aria-label="Views, enquiries and bookings trend">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = Math.round(max * ratio);
          const lineY = y(value);
          return (
            <g key={ratio}>
              <line x1={left} x2={width - right} y1={lineY} y2={lineY} stroke="#e5e5e5" strokeWidth="1" />
              <text x={left - 8} y={lineY + 4} textAnchor="end" fontSize="11" fill="#9e9e9e">{formatCompact(value)}</text>
            </g>
          );
        })}
        {series.map((item) => (
          <polyline
            key={item.key}
            points={linePath(data.map((point) => point[item.key]), width, height, left, right, top, bottom)}
            fill="none"
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        ))}
        {data.map((point, index) => {
          if (index % labelStep !== 0 && index !== data.length - 1) return null;
          const x = left + (data.length <= 1 ? 0 : (index / (data.length - 1)) * (width - left - right));
          return <text key={point.date} x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="#9e9e9e">{point.date.slice(5)}</text>;
        })}
      </svg>
    </div>
  );
}

function DonutChart({ items, emptyLabel }: { items: Array<{ label: string; value: number }>; emptyLabel: string }): JSX.Element {
  const colors = ['#0057ff', '#e6b200', '#16a34a', '#8b5cf6', '#dc2626', '#64748b', '#0f766e'];
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const segments = items
    .filter((item) => item.value > 0)
    .map((item, index) => {
      const start = cursor;
      const end = cursor + (item.value / Math.max(1, total)) * 360;
      cursor = end;
      return `${colors[index % colors.length]} ${start}deg ${end}deg`;
    });
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: segments.length ? `conic-gradient(${segments.join(',')})` : '#e5e5e5' }}>
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="text-2xl font-bold text-gray-900">{formatCompact(total)}</span>
          <span className="text-[11px] text-gray-500">Total</span>
        </div>
      </div>
      <div className="min-w-[130px] flex-1 space-y-2">
        {items.length ? items.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-gray-600">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="truncate">{item.label.split('_').join(' ')}</span>
            </span>
            <span className="font-semibold text-gray-900">{formatNumber(item.value)}</span>
          </div>
        )) : <p className="text-sm text-gray-400">{emptyLabel}</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: JSX.Element; accent: string }): JSX.Element {
  return (
    <div className="studio-card p-4">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Live</span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-gray-900">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function TableEmpty({ colSpan, label }: { colSpan: number; label: string }): JSX.Element {
  return <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-gray-400">{label}</td></tr>;
}

function AdminToolbar({ value, onChange, status, statuses, onStatus, placeholder, onSubmit, children }: { value: string; onChange: (value: string) => void; status: string; statuses: string[]; onStatus: (value: string) => void; placeholder: string; onSubmit: () => void; children?: JSX.Element }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input className={`${inputClass} pl-9`} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSubmit(); }} placeholder={placeholder} />
      </div>
      <label className="relative">
        <span className="sr-only">Status</span>
        <select className={`${inputClass} min-w-[150px] cursor-pointer pr-8`} value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((item) => <option key={item} value={item}>{item.split('_').join(' ')}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      </label>
      {children}
    </div>
  );
}

export default function AdminDashboard(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  /* Derived from the URL on every render rather than mirrored into state: the rail
     navigates on its own, so a state copy left the view stuck on the tab it mounted
     with. The URL is the single source of truth for which tab is visible. */
  const requestedTab = searchParams.get('tab');
  const tab: AdminTab = (ADMIN_TAB_IDS as readonly string[]).includes(requestedTab ?? '') ? (requestedTab as AdminTab) : 'overview';
  const [periodDays, setPeriodDays] = useState(30);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [agents, setAgents] = useState<AdminAgentDTO[]>([]);
  const [properties, setProperties] = useState<AdminPropertyDTO[]>([]);
  const [bookings, setBookings] = useState<AdminBookingDTO[]>([]);
  const [requests, setRequests] = useState<AdminRequestDTO[]>([]);
  const [agentSearch, setAgentSearch] = useState('');
  const [agentStatus, setAgentStatus] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupNotice, setSetupNotice] = useState<{ name: string; sent: boolean; url?: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [reviewTarget, setReviewTarget] = useState<{ property: AdminPropertyDTO; action: ReviewAction } | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [createForm, setCreateForm] = useState<AdminCreateAgentBody>({ firstName: '', lastName: '', phone: '', email: '', role: 'AGENT', agencyName: '', licenseNumber: '', provinceId: '' });
  /* Nonce so clicking Review twice on the same row still re-triggers the scroll.
     Single slot for both queues: a stale focus would otherwise hijack the next
     navigation and drop the admin on the wrong queue. */
  const [verificationFocus, setVerificationFocus] = useState<{ kind: 'property' | 'agent'; id: string; nonce: number } | null>(null);

  const goToVerification = (kind: 'property' | 'agent', id: string) => {
    setVerificationFocus({ kind, id, nonce: Date.now() });
    selectTab('verification');
  };
  const reviewAgent = (agentId: string) => goToVerification('agent', agentId);
  const reviewProperty = (propertyId: string) => goToVerification('property', propertyId);

  const selectTab = (next: AdminTab) => {
    setSearchParams(next === 'overview' ? {} : { tab: next });
  };

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await adminApi.summary({ periodDays }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAgents((await adminApi.agents({ q: agentSearch || undefined, status: agentStatus || undefined, pageSize: 100 })).items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [agentSearch, agentStatus]);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProperties((await adminApi.properties({ q: propertySearch || undefined, status: propertyStatus || undefined, pageSize: 100 })).items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [propertySearch, propertyStatus]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings((await adminApi.bookings({ q: bookingSearch || undefined, status: bookingStatus || undefined, pageSize: 100 })).items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [bookingSearch, bookingStatus]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests((await adminApi.requests({ q: requestSearch || undefined, status: requestStatus || undefined, pageSize: 100 })).items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [requestSearch, requestStatus]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (tab === 'agents') void loadAgents();
    if (tab === 'properties') void loadProperties();
    if (tab === 'bookings') void loadBookings();
    if (tab === 'requests') void loadRequests();
  }, [tab, loadAgents, loadProperties, loadBookings, loadRequests]);

  useEffect(() => {
    void geoApi.getProvinces().then(setProvinces).catch(() => undefined);
  }, []);

  useScrollToTop([tab]);

  const refreshCurrent = () => {
    if (tab === 'overview') void loadSummary();
    if (tab === 'agents') void loadAgents();
    if (tab === 'properties') void loadProperties();
    if (tab === 'bookings') void loadBookings();
    if (tab === 'requests') void loadRequests();
  };

  const changeAgentStatus = async (agent: AdminAgentDTO, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') => {
    if (agent.agentStatus === status) return;
    const label = status === 'ACTIVE' ? 'Activate' : status === 'SUSPENDED' ? 'Suspend' : 'Disable';
    if (!window.confirm(`${label} ${agent.firstName} ${agent.lastName}?`)) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.setAgentStatus(agent.id, { status });
      await loadAgents();
      await loadSummary();
      invalidateRailCounts();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitCreateAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await adminApi.createAgent({ ...createForm, email: createForm.email.trim(), provinceId: createForm.provinceId || undefined, agencyName: createForm.agencyName || undefined, licenseNumber: createForm.licenseNumber || undefined });
      setSetupNotice({ name: `${createForm.firstName.trim()} ${createForm.lastName.trim()}`, sent: created.setupEmailSent !== false, url: created.setupUrl });
      setCreateOpen(false);
      setCreateForm({ firstName: '', lastName: '', phone: '', email: '', role: 'AGENT', agencyName: '', licenseNumber: '', provinceId: '' });
      await loadAgents();
      await loadSummary();
      invalidateRailCounts();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewTarget) return;
    setSaving(true);
    setError(null);
    try {
      const body: AdminPropertyReviewBody =
        reviewTarget.action === 'reject' || reviewTarget.action === 'block'
          ? { reason: reviewText }
          : { note: reviewText || undefined };
      if (reviewTarget.action === 'block') {
        await adminApi.blockProperty(reviewTarget.property.id, body);
      } else if (reviewTarget.action === 'unblock') {
        await adminApi.unblockProperty(reviewTarget.property.id, body);
      } else {
        await adminApi.reviewProperty(reviewTarget.property.id, reviewTarget.action, body);
      }
      setReviewTarget(null);
      setReviewText('');
      await loadProperties();
      await loadSummary();
      invalidateRailCounts();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateBooking = async (id: string, status: string) => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.setBookingStatus(id, status);
      await loadBookings();
      invalidateRailCounts();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateRequest = async (id: string, status: string) => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.setRequestStatus(id, status);
      await loadRequests();
      invalidateRailCounts();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const overview = useMemo(() => summary, [summary]);

  return (
    <div className="mx-auto w-full max-w-[1800px] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">System administration</p>
          <h1 className="page-title mt-1">Control center</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor the platform, review inventory and manage operational teams.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={`${inputClass} w-auto min-w-[150px] cursor-pointer`} value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))} aria-label="Analytics period">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button type="button" onClick={refreshCurrent} className="btn-outline" disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Refresh</button>
        </div>
      </div>

      {error ? <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-notVerified/20 bg-notVerified/5 px-4 py-3 text-sm text-notVerified"><span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X className="h-4 w-4" /></button></div> : null}
      {setupNotice ? <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-verified/20 bg-verified/5 px-4 py-3 text-sm text-gray-700"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-verified" />{setupNotice.sent ? `Setup email sent to ${setupNotice.name}.` : `SMTP is not configured; use the setup link for ${setupNotice.name}.`}</span><span className="flex shrink-0 items-center gap-3">{setupNotice.url ? <a href={setupNotice.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 underline underline-offset-2">Open setup link</a> : null}<button type="button" onClick={() => setSetupNotice(null)} aria-label="Dismiss setup notice"><X className="h-4 w-4" /></button></span></div> : null}

      {tab === 'overview' ? (
        <div className="space-y-6">
          {loading && !overview ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-gray-100" />)}</div> : overview ? (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total users" value={overview.totals.users} icon={<Users className="h-4 w-4" />} accent="bg-brand-500/10 text-brand-600" />
                <StatCard label="Active agents" value={`${overview.totals.activeAgents}/${overview.totals.agents}`} icon={<UserCog className="h-4 w-4" />} accent="bg-accent/40 text-gray-800" />
                <StatCard label="Properties" value={overview.totals.properties} icon={<Building2 className="h-4 w-4" />} accent="bg-verified/10 text-verified" />
                <StatCard label="Pending review" value={overview.totals.underReviewProperties} icon={<FileCheck2 className="h-4 w-4" />} accent="bg-purple-500/10 text-purple-600" />
                <StatCard label="Published properties" value={overview.totals.publishedProperties} icon={<Check className="h-4 w-4" />} accent="bg-verified/10 text-verified" />
                <StatCard label="Sale requests" value={overview.totals.saleRequests} icon={<MessageSquareText className="h-4 w-4" />} accent="bg-accent/40 text-gray-800" />
                <StatCard label="Visit bookings" value={overview.totals.bookings} icon={<CalendarDays className="h-4 w-4" />} accent="bg-blue-500/10 text-blue-600" />
                <StatCard label="Property views" value={overview.totals.views} icon={<Eye className="h-4 w-4" />} accent="bg-purple-500/10 text-purple-600" />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <section className="studio-card p-5">
                  <div className="mb-2 flex items-center justify-between gap-3"><div><h2 className="section-title">Platform activity</h2><p className="mt-1 text-xs text-gray-500">Daily engagement over the selected period</p></div><Activity className="h-5 w-5 text-brand-500" /></div>
                  <TrendChart data={overview.trend} />
                </section>
                <section className="studio-card p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="section-title">Property pipeline</h2><p className="mt-1 text-xs text-gray-500">Current lifecycle distribution</p></div><BarChart3 className="h-5 w-5 text-brand-500" /></div><DonutChart items={overview.propertyStatus} emptyLabel="No property status data" /></section>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <section className="studio-card p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="section-title">Agent health</h2><p className="mt-1 text-xs text-gray-500">Account availability across the network</p></div><ShieldCheck className="h-5 w-5 text-verified" /></div><DonutChart items={overview.agentStatus} emptyLabel="No agent status data" /></section>
                <section className="studio-card overflow-hidden"><div className="flex items-center justify-between border-b border-gray-200 p-5"><div><h2 className="section-title">Finance snapshot</h2><p className="mt-1 text-xs text-gray-500">Payments, commissions and refunds by currency</p></div><CircleDollarSign className="h-5 w-5 text-verified" /></div>{overview.finance.length ? <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm"><thead><tr className="border-b border-gray-100 text-left text-xs text-gray-500"><th className="px-5 py-3 font-medium">Currency</th><th className="px-5 py-3 font-medium">Payments</th><th className="px-5 py-3 font-medium">Commissions</th><th className="px-5 py-3 font-medium">Refunds</th></tr></thead><tbody>{overview.finance.map((row) => <tr key={row.currency} className="border-b border-gray-100 last:border-0"><td className="px-5 py-3 font-semibold">{row.currency}</td><td className="px-5 py-3 text-gray-600">{formatNumber(row.payments)}</td><td className="px-5 py-3 text-gray-600">{formatNumber(row.commissions)}</td><td className="px-5 py-3 text-gray-600">{formatNumber(row.refunds)}</td></tr>)}</tbody></table></div> : <p className="p-8 text-center text-sm text-gray-400">No finance records yet.</p>}</section>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <section className="studio-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="section-title">Top agents</h2><p className="mt-1 text-xs text-gray-500">Ranked by property volume</p></div><Users className="h-5 w-5 text-brand-500" /></div>{overview.topAgents.length ? <div className="space-y-3">{overview.topAgents.map((agent, index) => <div key={agent.id} className="flex items-center gap-3"><span className="w-5 text-xs font-bold text-gray-400">#{index + 1}</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">{initials(agent)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{agent.firstName} {agent.lastName}</p><p className="text-xs text-gray-400">{agent.agencyName || agent.agentCode || 'Independent agent'}</p></div><span className="text-sm font-semibold text-gray-700">{formatNumber(agent.totalProperties)}</span></div>)}</div> : <p className="py-8 text-center text-sm text-gray-400">No agent activity yet.</p>}</section>
                <section className="studio-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="section-title">Recent inventory</h2><p className="mt-1 text-xs text-gray-500">Latest property records</p></div><Building2 className="h-5 w-5 text-brand-500" /></div>{overview.recentProperties.length ? <div className="space-y-3">{overview.recentProperties.map((property) => <button key={property.id} type="button" onClick={() => { setPropertyStatus(property.status); selectTab('properties'); }} className="flex w-full items-center gap-3 rounded-xl p-1 text-left transition-colors hover:bg-gray-50"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400">{property.media?.[0]?.thumbUrl || property.media?.[0]?.url ? <img src={property.media[0].thumbUrl || property.media[0].url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{property.title}</p><p className="text-xs text-gray-400">{property.propertyId} · {property.status}</p></div></button>)}</div> : <p className="py-8 text-center text-sm text-gray-400">No properties yet.</p>}</section>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {tab === 'agents' ? <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><AdminToolbar value={agentSearch} onChange={setAgentSearch} status={agentStatus} statuses={AGENT_STATUSES} onStatus={setAgentStatus} placeholder="Search agents, code or agency" onSubmit={() => void loadAgents()}><button type="button" className="btn-dark" onClick={() => { setSetupNotice(null); setCreateOpen(true); }}><Plus className="h-4 w-4" />Create agent</button></AdminToolbar></div><div className="studio-card overflow-x-auto"><table className="w-full min-w-[920px] text-sm"><thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500"><th className="px-5 py-3 font-medium">Agent</th><th className="px-5 py-3 font-medium">Code / agency</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Verified</th><th className="px-5 py-3 font-medium">Properties</th>
<th className="px-5 py-3 font-medium">Deals</th><th className="px-5 py-3" /></tr></thead><tbody>{agents.length ? agents.map((agent) => <tr key={agent.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"><td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">{initials(agent)}</span><div><p className="font-medium text-gray-900">{agent.firstName} {agent.lastName}</p><p className="text-xs text-gray-400">{agent.phone || agent.email || '—'}</p></div></div></td><td className="px-5 py-3"><p className="font-medium text-gray-700">{agent.agentCode || '—'}</p><p className="text-xs text-gray-400">{agent.agencyName || 'Independent'}</p></td><td className="px-5 py-3 text-xs text-gray-600">{agent.role.split('_').join(' ')}</td><td className="px-5 py-3"><select disabled={saving} value={agent.agentStatus} onChange={(event) => void changeAgentStatus(agent, event.target.value as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE')} className="h-8 cursor-pointer rounded-full border border-gray-200 bg-surface px-2.5 text-xs font-semibold outline-none"><option value="ACTIVE">ACTIVE</option><option value="SUSPENDED">SUSPENDED</option><option value="INACTIVE">DISABLED</option></select></td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${agent.verificationStatus === 'VERIFIED' ? 'bg-verified/10 text-verified' : 'bg-gray-100 text-gray-500'}`}>{agent.verificationStatus === 'VERIFIED' ? 'Verified' : 'Not verified'}</span></td>
<td className="px-5 py-3 text-gray-700">{formatNumber(agent.totalProperties)}</td><td className="px-5 py-3 text-gray-700">{formatNumber(agent.totalDeals)}</td><td className="px-5 py-3 text-right"><button type="button" onClick={() => reviewAgent(agent.id)} className="text-xs font-semibold text-brand-600 hover:text-brand-800">{agent.verificationStatus === 'VERIFIED' ? 'Verified' : 'Review'}</button></td>
</tr>) : <TableEmpty colSpan={8} label="No agents match this filter." />}</tbody></table></div></section> : null}

      {tab === 'properties' ? <section className="space-y-4"><AdminToolbar value={propertySearch} onChange={setPropertySearch} status={propertyStatus} statuses={PROPERTY_STATUSES} onStatus={setPropertyStatus} placeholder="Search title or property ID" onSubmit={() => void loadProperties()} /><div className="studio-card overflow-x-auto"><table className="w-full min-w-[1140px] text-sm"><thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500"><th className="px-5 py-3 font-medium">Property</th><th className="px-5 py-3 font-medium">Type</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Price</th><th className="px-5 py-3 font-medium">Submitted</th><th className="px-5 py-3 font-medium">Verification</th><th className="px-5 py-3" /></tr></thead><tbody>{properties.length ? properties.map((property) => <tr key={property.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"><td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400">{property.media?.[0]?.thumbUrl || property.media?.[0]?.url ? <img src={property.media[0].thumbUrl || property.media[0].url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-4 w-4" />}</span><div className="min-w-0"><p className="max-w-[260px] truncate font-medium text-gray-900">{property.title}</p><p className="text-xs text-gray-400">{property.propertyId}</p></div></div></td><td className="px-5 py-3 text-xs text-gray-600">{property.listingType} · {property.propertyType}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(property.status)}`}>{property.status.split('_').join(' ')}</span></td><td className="px-5 py-3 text-gray-700">{formatNumber(property.price.amount)} {property.price.currency}</td><td className="px-5 py-3 text-xs text-gray-500">{formatDate(property.createdAt)}</td><td className="px-5 py-3"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${verificationClass(property.verification.status)}`}>{property.verification.status.split('_').join(' ')}</span><button type="button" onClick={() => reviewProperty(property.id)} className="text-xs font-semibold text-brand-600 hover:text-brand-800">Review</button></div></td>
<td className="px-5 py-3 text-right"><div className="flex flex-wrap items-center justify-end gap-2">{['SUBMITTED', 'UNDER_REVIEW'].includes(property.status) ? <><button type="button" onClick={() => { setReviewTarget({ property, action: 'approve' }); setReviewText(''); }} className="rounded-full bg-verified/10 px-2.5 py-1 text-xs font-semibold text-verified">Approve</button><button type="button" onClick={() => { setReviewTarget({ property, action: 'reject' }); setReviewText(''); }} className="rounded-full bg-notVerified/10 px-2.5 py-1 text-xs font-semibold text-notVerified">Reject</button><button type="button" onClick={() => { setReviewTarget({ property, action: 'request-correction' }); setReviewText(''); }} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">Correct</button></> : null}{property.status === 'SUSPENDED' ? <button type="button" onClick={() => { setReviewTarget({ property, action: 'unblock' }); setReviewText(''); }} className="rounded-full bg-verified/10 px-2.5 py-1 text-xs font-semibold text-verified">Unblock</button> : null}{BLOCKABLE_STATUSES.includes(property.status) ? <button type="button" onClick={() => { setReviewTarget({ property, action: 'block' }); setReviewText(''); }} className="rounded-full bg-notVerified px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-notVerified/90">Block</button> : null}{!['SUBMITTED', 'UNDER_REVIEW', 'SUSPENDED'].includes(property.status) && !BLOCKABLE_STATUSES.includes(property.status) ? <span className="text-xs text-gray-400">{formatDate(property.reviewedAt)}</span> : null}</div></td>
</tr>) : <TableEmpty colSpan={7} label="No properties match this filter." />}</tbody></table></div></section> : null}

      {tab === 'bookings' ? <section className="space-y-4"><AdminToolbar value={bookingSearch} onChange={setBookingSearch} status={bookingStatus} statuses={BOOKING_STATUSES} onStatus={setBookingStatus} placeholder="Search booking reference" onSubmit={() => void loadBookings()} /><div className="studio-card overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500"><th className="px-5 py-3 font-medium">Booking</th><th className="px-5 py-3 font-medium">Property</th><th className="px-5 py-3 font-medium">Requester</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Status</th></tr></thead><tbody>{bookings.length ? bookings.map((booking) => <tr key={booking.id} className="border-b border-gray-100 last:border-0"><td className="px-5 py-3"><p className="font-medium text-gray-900">{booking.bookingReference}</p><p className="text-xs text-gray-400">{formatDate(booking.createdAt)}</p></td><td className="px-5 py-3 text-gray-700">{booking.property?.title || '—'}</td><td className="px-5 py-3"><p className="font-medium text-gray-800">{booking.user.firstName} {booking.user.lastName}</p><p className="text-xs text-gray-400">{booking.user.phone || booking.user.email || '—'}</p></td><td className="px-5 py-3 text-xs text-gray-600">{booking.session?.date || booking.preferredDate || 'Any time'}</td><td className="px-5 py-3"><select disabled={saving} value={booking.status} onChange={(event) => void updateBooking(booking.id, event.target.value)} className="h-8 rounded-full border border-gray-200 bg-surface px-2.5 text-xs font-semibold outline-none"><option value="PENDING">PENDING</option>{BOOKING_STATUSES.filter((status) => status !== 'PENDING').map((status) => <option key={status} value={status}>{status}</option>)}</select></td></tr>) : <TableEmpty colSpan={5} label="No bookings match this filter." />}</tbody></table></div></section> : null}

      {tab === 'requests' ? <section className="space-y-4"><AdminToolbar value={requestSearch} onChange={setRequestSearch} status={requestStatus} statuses={REQUEST_STATUSES} onStatus={setRequestStatus} placeholder="Search subject or message" onSubmit={() => void loadRequests()} /><div className="studio-card overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500"><th className="px-5 py-3 font-medium">Request</th><th className="px-5 py-3 font-medium">Sender</th><th className="px-5 py-3 font-medium">Property</th><th className="px-5 py-3 font-medium">Created</th><th className="px-5 py-3 font-medium">Status</th></tr></thead><tbody>{requests.length ? requests.map((request) => <tr key={request.id} className="border-b border-gray-100 last:border-0"><td className="max-w-[260px] px-5 py-3"><p className="truncate font-medium text-gray-900">{request.subject || 'Property request'}</p><p className="truncate text-xs text-gray-400">{request.message}</p></td><td className="px-5 py-3"><p className="font-medium text-gray-800">{request.sender.firstName} {request.sender.lastName}</p><p className="text-xs text-gray-400">{request.sender.phone || request.sender.email || '—'}</p></td><td className="px-5 py-3 text-gray-700">{request.property?.title || '—'}</td><td className="px-5 py-3 text-xs text-gray-500">{formatDate(request.createdAt)}</td><td className="px-5 py-3"><select disabled={saving} value={request.status} onChange={(event) => void updateRequest(request.id, event.target.value)} className="h-8 rounded-full border border-gray-200 bg-surface px-2.5 text-xs font-semibold outline-none"><option value="NEW">NEW</option>{REQUEST_STATUSES.filter((status) => status !== 'NEW').map((status) => <option key={status} value={status}>{status}</option>)}</select></td></tr>) : <TableEmpty colSpan={5} label="No requests match this filter." />}</tbody></table></div></section> : null}

      {tab === 'verification' ? <AdminVerificationSection focus={verificationFocus} onFocusConsumed={() => setVerificationFocus(null)} /> : null}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create agent account" size="lg">
        <form onSubmit={submitCreateAgent} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="admin-agent-first">First name</label><input id="admin-agent-first" required className={inputClass} value={createForm.firstName} onChange={(event) => setCreateForm((form) => ({ ...form, firstName: event.target.value }))} /></div><div><label className="label" htmlFor="admin-agent-last">Last name</label><input id="admin-agent-last" required className={inputClass} value={createForm.lastName} onChange={(event) => setCreateForm((form) => ({ ...form, lastName: event.target.value }))} /></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="admin-agent-phone">Phone</label><input id="admin-agent-phone" required className={inputClass} value={createForm.phone} onChange={(event) => setCreateForm((form) => ({ ...form, phone: event.target.value }))} /></div><div><label className="label" htmlFor="admin-agent-email">Email</label><input id="admin-agent-email" type="email" required className={inputClass} value={createForm.email} onChange={(event) => setCreateForm((form) => ({ ...form, email: event.target.value }))} /><p className="mt-1 text-xs text-gray-500">The setup link will be sent to this address.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">The agent will receive an email to choose their password and activate the account.</div><div><label className="label" htmlFor="admin-agent-role">Role</label><select id="admin-agent-role" className={`${inputClass} cursor-pointer`} value={createForm.role} onChange={(event) => setCreateForm((form) => ({ ...form, role: event.target.value as AdminCreateAgentBody['role'] }))}><option value="AGENT">AGENT</option><option value="FIELD_AGENT">FIELD_AGENT</option></select></div></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="admin-agency">Agency name</label><input id="admin-agency" className={inputClass} value={createForm.agencyName} onChange={(event) => setCreateForm((form) => ({ ...form, agencyName: event.target.value }))} /></div><div><label className="label" htmlFor="admin-license">License number</label><input id="admin-license" className={inputClass} value={createForm.licenseNumber} onChange={(event) => setCreateForm((form) => ({ ...form, licenseNumber: event.target.value }))} /></div></div>
          <div><label className="label" htmlFor="admin-province">Province</label><select id="admin-province" className={`${inputClass} cursor-pointer`} value={createForm.provinceId} onChange={(event) => setCreateForm((form) => ({ ...form, provinceId: event.target.value }))}><option value="">No province</option>{provinces.map((province) => <option key={province._id} value={province._id}>{province.name}</option>)}</select></div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" className="btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" className="btn-dark" disabled={saving}>{saving ? 'Creating…' : 'Create agent'}</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(reviewTarget)} onClose={() => setReviewTarget(null)} title={REVIEW_TITLES[reviewTarget?.action ?? 'approve']} size="sm">
        <form onSubmit={submitReview} className="space-y-4"><p className="text-sm text-gray-600">{reviewTarget?.property.title}</p>{reviewTarget?.property.blockReason ? <p className="rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">Current block reason: {reviewTarget.property.blockReason}</p> : null}<div><label className="label" htmlFor="admin-review-text">{REVIEW_REASON_ACTIONS.includes(reviewTarget?.action ?? 'approve') ? 'Reason' : 'Review note'}</label><textarea id="admin-review-text" required={REVIEW_REASON_ACTIONS.includes(reviewTarget?.action ?? 'approve')} rows={5} className={`${inputClass} h-auto resize-y py-3`} value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder={REVIEW_REASON_ACTIONS.includes(reviewTarget?.action ?? 'approve') ? 'Explain why this listing is blocked…' : 'Optional internal note…'} /></div><div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" className="btn-outline" onClick={() => setReviewTarget(null)}>Cancel</button><button type="submit" className={REVIEW_DANGER_ACTIONS.includes(reviewTarget?.action ?? 'approve') ? 'btn-danger' : 'btn-dark'} disabled={saving}>{saving ? 'Saving…' : 'Confirm'}</button></div></form>
      </Modal>
    </div>
  );
}
