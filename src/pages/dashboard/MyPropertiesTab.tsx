import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Building2, ChevronLeft, ChevronRight, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import type { AgentPropertyDTO } from '@immo/shared-types';
import { useLanguage } from '../../contexts/LanguageContext';
import { agentPropertiesApi, getApiErrorMessage, verificationApi } from '../../lib/api';
import { formatCompact, formatDate } from '../../lib/format';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Modal from '../../components/Modal';
import AddPropertyModal from './AddPropertyModal';

type SortKey = 'colListed' | 'colViews';

const PAGE_SIZE = 10;

const EDITABLE_STATUSES = ['DRAFT', 'NEEDS_CORRECTION', 'REJECTED'];
/** Sold/rented listings can be brought back to market by the owning agent. */
const RELISTABLE_STATUSES = ['SOLD', 'RENTED'];
const DELETABLE_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'NEEDS_CORRECTION',
];
/** A property can enter the verification queue once it has been submitted for review.
 *  New listings arrive as SUBMITTED, so that state has to be allowed here. */
const VERIFIABLE_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'NEEDS_CORRECTION',
  'REJECTED',
];

function statusStyle(status: string): string {
  const s = status.toUpperCase();
  if (s === 'PUBLISHED') return 'bg-verified/10 text-verified';
  if (s === 'DRAFT' || s === 'SUBMITTED' || s === 'NEEDS_CORRECTION' || s === 'UNDER_REVIEW')
    return 'bg-accent/20 text-gray-800';
  if (s === 'REJECTED' || s === 'SUSPENDED') return 'bg-notVerified/10 text-notVerified';
  if (s === 'SOLD' || s === 'RENTED' || s === 'ARCHIVED') return 'bg-gray-100 text-gray-600';
  return 'bg-gray-100 text-gray-600';
}

/** Windowed page list with null marking an ellipsis gap. */
function pageNumbers(current: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | null)[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push(null);
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < totalPages - 1) pages.push(null);
  pages.push(totalPages);
  return pages;
}

export default function MyPropertiesTab(): JSX.Element {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ?? '';
  const propertyId = searchParams.get('property') ?? '';
  /* Search and paging live in the URL so a filtered view is shareable and survives reload. */
  const searchQuery = searchParams.get('q') ?? '';
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);

  const [properties, setProperties] = useState<AgentPropertyDTO[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  /** Local mirror of ?q so typing stays responsive while the URL updates on a debounce. */
  const [searchText, setSearchText] = useState(searchQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgentPropertyDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey>('colListed');
  const [sortDesc, setSortDesc] = useState(true);
  const [detail, setDetail] = useState<AgentPropertyDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<AgentPropertyDTO | null>(null);
  const [verifyNote, setVerifyNote] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyDone, setVerifyDone] = useState<string | null>(null);

  /* Header "Add property" CTA opens the create modal via ?tab=myProperties&add=1 */
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setAddOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('add')]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await agentPropertiesApi.list({
        page: pageParam,
        pageSize: PAGE_SIZE,
        ...(searchQuery ? { q: searchQuery } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        sortBy: sortKey === 'colViews' ? 'views' : 'created',
        sortOrder: sortDesc ? 'desc' : 'asc',
      });
      setProperties(res.items);
      setMeta(res.meta);
      /* Deleting the last row of the last page leaves us past the end - step back. */
      if (res.items.length === 0 && res.meta.total > 0 && pageParam > 1) {
        const next = new URLSearchParams(searchParams);
        next.set('page', String(pageParam - 1));
        setSearchParams(next, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [pageParam, searchQuery, statusFilter, sortKey, sortDesc, searchParams, setSearchParams]);

  useEffect(() => {
    void load();
  }, [load]);

  /* Reflect URL changes (chip cleared, browser back) back into the input. */
  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  /* Debounced so a request is not fired per keystroke. */
  useEffect(() => {
    if (searchText === searchQuery) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchText) next.set('q', searchText);
      else next.delete('q');
      next.delete('page');
      setSearchParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchText, searchQuery, searchParams, setSearchParams]);

  /** Any change to the result set starts again from page 1. */
  const goToPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    if (page <= 1) next.delete('page');
    else next.set('page', String(page));
    setSearchParams(next);
  };

  const clearSearch = () => {
    setSearchText('');
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    next.delete('page');
    setSearchParams(next);
  };

  useEffect(() => {
    if (!propertyId) {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    void agentPropertiesApi.get(propertyId)
      .then((property) => {
        if (!cancelled) setDetail(property);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(null);
          setDetailError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const openDetail = (property: AgentPropertyDTO) => {    const next = new URLSearchParams(searchParams);
    next.set('tab', 'myProperties');
    next.set('property', property._id);
    setSearchParams(next);
  };

  const closeDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('property');
    setSearchParams(next);
  };

  const openEdit = (property: AgentPropertyDTO) => {
    setActionError(null);
    setEditTarget(property);
  };

  const removeProperty = async (property: AgentPropertyDTO) => {
    if (!window.confirm(t('dashboard.deletePropertyConfirm').replace('{title}', property.title))) return;
    setActionError(null);
    setBusyId(property._id);
    try {
      await agentPropertiesApi.remove(property._id);
      setSelected((current) => {
        const next = { ...current };
        delete next[property._id];
        return next;
      });
      if (propertyId === property._id) closeDetail();
      await load();
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  /* SOLD/RENTED listings are re-submitted for admin review rather than going
     straight back live, so the property stays offline until an admin publishes. */
  const relistProperty = async (property: AgentPropertyDTO) => {
    if (!window.confirm(t('dashboard.relistPropertyConfirm').replace('{title}', property.title))) return;
    setActionError(null);
    setBusyId(property._id);
    try {
      await agentPropertiesApi.transition(property._id, 'relist');
      await load();
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const openVerify = (property: AgentPropertyDTO) => {    setActionError(null);
    setVerifyError(null);
    setVerifyDone(null);
    setVerifyNote('');
    setVerifyTarget(property);
  };

  const submitVerify = async () => {
    if (!verifyTarget) return;
    setVerifySubmitting(true);
    setVerifyError(null);
    try {
      const res = await verificationApi.createRequest(verifyTarget._id, verifyNote.trim() || undefined);
      setVerifyDone(String((res as any)?.verificationCode ?? ''));
      await load();
    } catch (err) {
      setVerifyError(getApiErrorMessage(err));
    } finally {
      setVerifySubmitting(false);
    }
  };

  /* Filtering, sorting and paging all happen server-side, so this only derives the
     display values the table needs. */
  const rows = useMemo(
    () =>
      properties.map((p) => ({
        p,
        views: p.stats?.views ?? p.agentAnalytics?.viewsGenerated ?? 0,
        inquiries: p.ownerAnalytics?.enquiries ?? p.agentAnalytics?.enquiriesGenerated ?? 0,
      })),
    [properties],
  );

  const allSelected = rows.length > 0 && rows.every((r) => selected[r.p._id]);
  const toggleAll = () => {
    setSelected(allSelected ? {} : Object.fromEntries(rows.map((r) => [r.p._id, true])));
  };

  const sortableHeader = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => {
        if (sortKey === key) setSortDesc((d) => !d);
        else {
          setSortKey(key);
          setSortDesc(true);
        }
        /* Re-ordering invalidates the current offset. */
        goToPage(1);
      }}
      className="inline-flex items-center gap-1 font-medium transition-colors hover:text-gray-900"
    >
      {label}
      {sortKey === key ? (sortDesc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : null}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <label htmlFor="mp-search" className="sr-only">{t('dashboard.searchProperties')}</label>
            <input
              id="mp-search"
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t('dashboard.searchProperties')}
              className="h-9 w-full rounded-full border border-gray-200 bg-surface pl-9 pr-3 text-ui text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-500"
            />
          </div>
          {Object.values(selected).filter(Boolean).length > 0 ? (
            <span className="shrink-0 text-[13px] text-gray-500">
              {Object.values(selected).filter(Boolean).length} {t('dashboard.properties')}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-ui font-medium text-white transition-colors hover:bg-gray-800"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          {t('dashboard.addNew')}
        </button>
      </div>

      {statusFilter ? (
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-2.5 pr-1.5 text-[13px] font-medium text-gray-700">
            {statusFilter}
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('status');
                setSearchParams(next);
              }}
              aria-label={t('dashboard.clearFilters')}
              className="flex h-5 w-5 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="mb-3 rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}</div>
      ) : error ? (
        <ErrorState title={t('error.loadFailed')} message={error} onRetry={() => void load()} retryLabel={t('error.retry')} />
      ) : rows.length === 0 ? (
        <div className="studio-card">
          {searchQuery ? (
            <EmptyState
              illustration="/no_content_illustration_v4.svg"
              title={t('empty.noResults')}
              description={t('dashboard.noSearchResults')}
              actionLabel={t('common.clear')}
              onAction={clearSearch}
              compact
            />
          ) : (
            <EmptyState
              illustration="/no_content_illustration_v4.svg"
              title={t('dashboard.emptyProps')}
              description={t('dashboard.emptyPropsDesc')}
              actionLabel={t('dashboard.cards.listCta')}
              onAction={() => setAddOpen(true)}
              compact
            />
          )}
        </div>
      ) : (
        <div className="studio-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-200 text-left text-[13px] text-gray-500">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label={t('dashboard.properties')}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">{t('dashboard.colProperty')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashboard.colFlags')}</th>
                  <th className="px-4 py-3 font-medium">{t('dashboard.colStatus')}</th>
                  <th className="px-4 py-3 font-medium">{sortableHeader('colListed', t('dashboard.colListed'))}</th>
                  <th className="px-4 py-3 font-medium">{sortableHeader('colViews', t('dashboard.colViews'))}</th>
                  <th className="px-4 py-3 font-medium">{t('dashboard.colInquiries')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('dashboard.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, views, inquiries }) => (
                  <tr
                    key={p._id}
                    className={`cursor-pointer border-b border-gray-100 last:border-0 transition-colors ${selected[p._id] ? 'bg-brand-500/5' : 'hover:bg-gray-50/60'}`}
                    onClick={() => openDetail(p)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={Boolean(selected[p._id])}
                        onChange={(e) => setSelected((s) => ({ ...s, [p._id]: e.target.checked }))}
                        aria-label={p.title}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {(() => {
                          const primary = p.media?.find((m) => m.isPrimary) ?? p.media?.[0];
                          const src = primary?.url ?? primary?.thumbUrl;
                          return src ? (
                            <img src={src} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                              <Building2 className="h-5 w-5" aria-hidden="true" />
                            </span>
                          );
                        })()}
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-body font-medium text-gray-900">{p.title}</p>
                          <p className="text-xs text-gray-400">{p.propertyId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                          {p.listingType}
                        </span>
                        {p.badges?.featured ? (
                          <span className="rounded-full bg-accent/30 px-2 py-0.5 text-[11px] font-semibold text-gray-800">Featured</span>
                        ) : null}
                        {p.verification?.status && p.verification.status !== 'NOT_VERIFIED' ? (
                          <span className="rounded-full bg-verified/10 px-2 py-0.5 text-[11px] font-semibold text-verified">
                            {p.verification.status}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500">{formatDate(p.publishedAt ?? p.createdAt)}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-700">{formatCompact(views)}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-700">{formatCompact(inquiries)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {(() => {
                          const vStatus = String(p.verification?.status ?? 'NOT_VERIFIED');
                          if (vStatus === 'VERIFIED' || vStatus === 'FULLY_VERIFIED') {
                            return (
                              <span
                                title={t('dashboard.verified')}
                                aria-label={t('dashboard.verified')}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-verified/10 text-verified"
                              >
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                              </span>
                            );
                          }
                          /* Open request comes from the API, so this reflects reality. */
                          const pending = Boolean(p.pendingVerification);
                          return (
                            <button
                              type="button"
                              disabled={busyId === p._id || pending || !VERIFIABLE_STATUSES.includes(p.status)}
                              onClick={() => openVerify(p)}
                              title={pending ? t('dashboard.verificationPending') : t('dashboard.requestVerification')}
                              aria-label={t('dashboard.requestVerification')}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-brand-500/10 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                            </button>
                          );
                        })()}
                        <button
                          type="button"
                          disabled={busyId === p._id || !RELISTABLE_STATUSES.includes(p.status)}
                          onClick={() => void relistProperty(p)}
                          title={t('dashboard.relistProperty')}
                          aria-label={t('dashboard.relistProperty')}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-brand-500/10 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === p._id || !EDITABLE_STATUSES.includes(p.status)}
                          onClick={() => openEdit(p)}
                          title={t('dashboard.editProperty')}
                          aria-label={t('dashboard.editProperty')}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === p._id || !DELETABLE_STATUSES.includes(p.status)}
                          onClick={() => void removeProperty(p)}
                          title={t('dashboard.deleteProperty')}
                          aria-label={t('dashboard.deleteProperty')}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-notVerified/10 hover:text-notVerified disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
            <span className="text-[13px] text-gray-500">
              {t('dashboard.resultsCount', {
                from: (meta.page - 1) * meta.pageSize + 1,
                to: Math.min(meta.page * meta.pageSize, meta.total),
                total: meta.total,
              })}
            </span>
            {meta.totalPages > 1 ? (
              <nav className="flex items-center gap-1" aria-label={t('common.pagination')}>
                <button
                  type="button"
                  disabled={meta.page <= 1}
                  onClick={() => goToPage(meta.page - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t('common.previous')}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                {pageNumbers(meta.page, meta.totalPages).map((n, i) =>
                  n === null ? (
                    <span key={`gap-${i}`} className="px-1 text-[13px] text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      aria-current={n === meta.page ? 'page' : undefined}
                      className={`h-8 min-w-8 rounded-lg px-2 text-[13px] font-medium transition-colors ${
                        n === meta.page
                          ? 'bg-ink text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => goToPage(meta.page + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t('common.next')}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      )}

      <AddPropertyModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          void load();
        }}
      />

      <AddPropertyModal
        property={editTarget}
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onCreated={() => {
          setEditTarget(null);
          void load();
        }}
      />

      <Modal open={verifyTarget !== null} onClose={() => setVerifyTarget(null)} title={t('dashboard.requestVerification')} size="sm">
        {verifyDone ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-verified/20 bg-verified/5 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verified text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t('dashboard.verificationRequested')}</p>
                {verifyDone ? <p className="text-xs text-gray-500">{t('dashboard.verificationCode')}: {verifyDone}</p> : null}
              </div>
            </div>
            <button type="button" onClick={() => setVerifyTarget(null)} className="btn-primary w-full">
              {t('common.close')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] leading-relaxed text-gray-500">{t('dashboard.requestVerificationDesc')}</p>
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="min-w-0 truncate text-sm font-semibold text-gray-900">{verifyTarget?.title}</p>
            </div>
            <div>
              <label htmlFor="verify-note" className="label">{t('dashboard.verificationNote')}</label>
              <textarea
                id="verify-note"
                rows={3}
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder={t('dashboard.verificationNotePlaceholder')}
                className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-surface px-3.5 py-2.5 text-body text-gray-900 outline-none focus:border-brand-500"
              />
            </div>
            {verifyError ? (
              <p role="alert" className="rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">{verifyError}</p>
            ) : null}
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setVerifyTarget(null)} className="btn-outline">
                {t('common.cancel')}
              </button>
              <button type="button" disabled={verifySubmitting} onClick={() => void submitVerify()} className="btn-primary">
                {verifySubmitting ? t('common.loading') : t('dashboard.requestVerification')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(propertyId)} onClose={closeDetail} title={detail?.title ?? t('dashboard.property')} size="lg">
        <div>
          {detailLoading ? (
            <div className="space-y-3">
              <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          ) : detailError ? (
            <div className="py-8 text-center text-sm text-notVerified">{detailError}</div>
          ) : detail ? (
            <div className="space-y-5">
              {detail.media?.[0]?.url || detail.media?.[0]?.thumbUrl ? (
                <img src={detail.media[0].url ?? detail.media[0].thumbUrl} alt={detail.title} className="h-48 w-full rounded-xl object-cover" />
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(detail.status)}`}>{detail.status}</span>
                <span className="text-xs text-gray-400">{detail.propertyId}</span>
              </div>
              {detail.status === 'SUSPENDED' && detail.blockReason ? (
                <p className="rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">
                  {t('dashboard.blockedByAdmin')}: {detail.blockReason}
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-3">
                <div><p className="text-xs text-gray-400">Price</p><p className="mt-1 font-semibold text-gray-900">{formatCompact(detail.price.amount)} {detail.price.currency}</p></div>
                <div><p className="text-xs text-gray-400">Location</p><p className="mt-1 text-sm font-medium text-gray-800">{[detail.location?.province?.name, detail.location?.commune?.name].filter(Boolean).join(', ') || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Listed</p><p className="mt-1 text-sm font-medium text-gray-800">{formatDate(detail.publishedAt ?? detail.createdAt)}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Views</p><p className="mt-1 text-lg font-bold text-gray-900">{formatCompact(detail.stats?.views ?? 0)}</p></div>
                <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Saves</p><p className="mt-1 text-lg font-bold text-gray-900">{formatCompact(detail.stats?.favorites ?? 0)}</p></div>
                <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Enquiries</p><p className="mt-1 text-lg font-bold text-gray-900">{formatCompact(detail.ownerAnalytics?.enquiries ?? detail.agentAnalytics?.enquiriesGenerated ?? 0)}</p></div>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}