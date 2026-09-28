import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Check,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { AdminAgentDTO } from '@immo/shared-types';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi, getApiErrorMessage, verificationApi } from '../../lib/api';
import { formatDate, formatNumber } from '../../lib/format';
import { invalidateRailCounts } from '../../lib/railCounts';
import { whatsappChatUrl, telUrl } from '../../lib/whatsapp';
import EmptyState from '../../components/EmptyState';
import MediaStrip, { srcOf } from '../../components/MediaStrip';
import Modal from '../../components/Modal';

type ReviewKind = 'property' | 'agent';

interface ReviewTarget {
  kind: ReviewKind;
  id: string;
  title: string;
  subtitle: string;
}

function initialsOf(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'U';
}

function requestStatusStyle(status: string): string {
  const s = status.toUpperCase();
  if (s === 'COMPLETED') return 'bg-verified/10 text-verified';
  if (s === 'REJECTED' || s === 'CANCELLED') return 'bg-notVerified/10 text-notVerified';
  if (s === 'IN_PROGRESS' || s === 'ASSIGNED' || s === 'PAYMENT_CONFIRMED' || s === 'UNDER_REVIEW') {
    return 'bg-accent/20 text-gray-800';
  }
  return 'bg-gray-100 text-gray-600';
}

function agentStatusStyle(status: string): string {
  return status === 'VERIFIED' ? 'bg-verified/10 text-verified' : 'bg-gray-100 text-gray-600';
}

/** Contact block shared by both tabs: tap-to-call, email and a direct WhatsApp chat. */
function ContactActions({
  phone,
  email,
  name,
  message,
}: {
  phone?: string;
  email?: string;
  name: string;
  message: string;
}): JSX.Element | null {
  const wa = whatsappChatUrl(phone, message);
  const tel = telUrl(phone);
  if (!phone && !email) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tel ? (
        <a
          href={tel}
          className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          {phone}
        </a>
      ) : null}
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#25D366]/10 px-2.5 text-[12px] font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/20"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          WhatsApp
        </a>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}?subject=${encodeURIComponent(name)}`}
          className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          {email}
        </a>
      ) : null}
    </div>
  );
}

export interface VerificationFocus {
  kind: 'property' | 'agent';
  id: string;
  nonce: number;
}

interface AdminVerificationSectionProps {
  /** Set when the admin clicks Review on a property/agent row: opens the matching queue and scrolls to it. */
  focus?: VerificationFocus | null;
  /** Called once the focus has been applied, so the parent can clear it and keep it from sticking. */
  onFocusConsumed?: () => void;
}

export default function AdminVerificationSection({ focus = null, onFocusConsumed }: AdminVerificationSectionProps): JSX.Element {
  const { t } = useLanguage();
  const [tab, setTab] = useState<ReviewKind>('property');

  const [requests, setRequests] = useState<Array<Record<string, unknown>>>([]);
  const [agents, setAgents] = useState<AdminAgentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<ReviewTarget | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const agentRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const propertyRowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'property') {
        const res = await verificationApi.listRequests({ page: 1, pageSize: 100 });
        setRequests(res.items);
      } else {
        const res = await adminApi.agents({ page: 1, pageSize: 100 });
        setAgents(res.items);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  /* Jumping from a table row to its review target: open the matching queue, then scroll
     once the row exists — the lists are fetched, so the node is absent on first paint. */
  useEffect(() => {
    if (!focus) return;
    setTab(focus.kind);
    setFocusedRowId(focus.id);
  }, [focus]);

  useEffect(() => {
    if (!focus || tab !== focus.kind || loading) return;
    const node = focus.kind === 'agent' ? agentRowRefs.current[focus.id] : propertyRowRefs.current[focus.id];
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onFocusConsumed?.();
  }, [focus, tab, loading, agents, requests]);

  const openReject = (target: ReviewTarget) => {
    setActionError(null);
    setReason('');
    setRejectTarget(target);
  };

  const approve = async (target: ReviewTarget) => {
    setSubmitting(true);
    setActionError(null);
    try {
      if (target.kind === 'property') {
        await verificationApi.complete(target.id, { result: 'VERIFIED' });
      } else {
        await adminApi.setAgentVerification(target.id, { status: 'VERIFIED' });
      }
      await load();
      invalidateRailCounts();
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    if (!reason.trim()) {
      setActionError(t('verification.reasonRequired'));
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      if (rejectTarget.kind === 'property') {
        await verificationApi.complete(rejectTarget.id, { result: 'NOT_VERIFIED', reason: reason.trim() });
      } else {
        await adminApi.setAgentVerification(rejectTarget.id, { status: 'NOT_VERIFIED', reason: reason.trim() });
      }
      setRejectTarget(null);
      await load();
      invalidateRailCounts();
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isPendingRequest = (r: Record<string, unknown>) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(String(r.status ?? '').toUpperCase());

  const propertyRows = useMemo(
    () => requests.filter((r) => (showDone ? true : isPendingRequest(r))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requests, showDone],
  );

  const agentRows = useMemo(
    () => agents.filter((a) => (showDone ? true : a.verificationStatus !== 'VERIFIED')),
    [agents, showDone],
  );

  const pendingCount = useMemo(
    () => (tab === 'property' ? requests.filter(isPendingRequest).length : agents.filter((a) => a.verificationStatus !== 'VERIFIED').length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, requests, agents],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setTab('property')}
            aria-selected={tab === 'property'}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === 'property' ? 'bg-surface text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="h-4 w-4" aria-hidden="true" />
            {t('verification.propertiesTab')}
            {tab === 'property' && pendingCount > 0 ? (
              <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{pendingCount}</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setTab('agent')}
            aria-selected={tab === 'agent'}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === 'agent' ? 'bg-surface text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t('verification.agentsTab')}
            {tab === 'agent' && pendingCount > 0 ? (
              <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{pendingCount}</span>
            ) : null}
          </button>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-gray-600">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          {t('verification.showCompleted')}
        </label>
      </div>

      {actionError && !rejectTarget ? (
        <p role="alert" className="rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg bg-notVerified/10 p-4 text-sm text-notVerified">{error}</p>
      ) : tab === 'property' ? (
        propertyRows.length === 0 ? (
          <div className="studio-card">
            <EmptyState
              illustration="/no_content_illustration_v4.svg"
              title={t('verification.noPendingProperties')}
              description={t('verification.noPendingPropertiesDesc')}
              compact
            />
          </div>
        ) : (
          <div className="space-y-3">
            {propertyRows.map((r) => {
              const property: any = r.propertyId;
              const requestedBy: any = r.requestedBy;
              const agent: any = property?.agentId;
              const agentUser: any = agent?.userId;
              const agentName = agentUser
                ? `${agentUser.firstName ?? ''} ${agentUser.lastName ?? ''}`.trim()
                : '';
              const media: any[] = Array.isArray(property?.media) ? property.media : [];
              const stripImages = media
                .map((m: any, i: number) => ({ id: String(m?._id ?? m?.id ?? `${r._id}-${i}`), src: srcOf(m ?? {}), caption: m?.caption }))
                .filter((m: { src: string }) => Boolean(m.src));
              const done = !isPendingRequest(r);
              const location = [property?.provinceId?.name, property?.communeId?.name].filter(Boolean).join(', ');
              const title = String(property?.title ?? r.verificationCode ?? '');
              return (
                <div
                  key={String(r._id)}
                  ref={(node) => {
                    const pid = String(property?._id ?? '');
                    if (pid) propertyRowRefs.current[pid] = node;
                  }}
                  className={`studio-card scroll-mt-24 overflow-hidden transition-shadow ${
                    focusedRowId && focusedRowId === String(property?._id ?? '') ? 'ring-2 ring-brand-500 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row">
                    {media.length > 0 ? (
                      <MediaStrip
                        images={stripImages}
                        title={title}
                      />
                    ) : (
                      <div className="flex h-28 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-400 sm:w-56 sm:shrink-0">
                        <Building2 className="h-6 w-6" aria-hidden="true" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-body font-semibold text-gray-900">{title}</p>
                          <p className="text-xs text-gray-400">
                            {String(property?.propertyId ?? '')} · {String(property?.listingType ?? '')}
                          </p>
                        </div>
                        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${requestStatusStyle(String(r.status ?? ''))}`}>
                          {String(r.status ?? '')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-600">
                        {location ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                            {location}
                          </span>
                        ) : null}
                        {property?.price ? (
                          <span className="font-semibold text-gray-900">
                            {formatNumber(Number(property.price.amount))} {String(property.price.currency ?? '')}
                          </span>
                        ) : null}
                        <span className="text-xs text-gray-400">
                          {t('verification.requestedOn', { date: formatDate(String(r.createdAt ?? '')) ?? '—' })}
                        </span>
                      </div>

                      {r.notes ? <p className="rounded-lg bg-gray-50 p-2.5 text-[13px] text-gray-600">{String(r.notes)}</p> : null}
                      {r.rejectionReason ? (
                        <p className="rounded-lg bg-notVerified/10 p-2.5 text-[13px] text-notVerified">
                          {t('verification.rejectionReason')}: {String(r.rejectionReason)}
                        </p>
                      ) : null}

                      <div className="rounded-lg border border-gray-100 p-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          {t('verification.agent')}
                        </p>
                        {agentUser ? (
                          <div className="mt-1.5 flex items-center gap-2.5">
                            {agentUser.photoUrl || agent?.photo ? (
                              <img src={agentUser.photoUrl ?? agent.photo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-600">
                                {initialsOf(agentUser.firstName, agentUser.lastName)}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-gray-900">{agentName}</p>
                              <p className="truncate text-xs text-gray-400">
                                {[agent?.agencyName, agent?.agentCode].filter(Boolean).join(' · ') || '—'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-[13px] text-gray-400">{t('verification.noAgent')}</p>
                        )}
                        {agentUser ? (
                          <div className="mt-2">
                            <ContactActions
                              phone={String(agentUser.phone ?? '')}
                              email={String(agentUser.email ?? '')}
                              name={agentName}
                              message={t('verification.agentWhatsappMessage', { title })}
                            />
                          </div>
                        ) : null}
                      </div>

                      {!done ? (
                        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                              void approve({
                                kind: 'property',
                                id: String(r._id),
                                title,
                                subtitle: String(property?.propertyId ?? ''),
                              })
                            }
                            className="btn-primary h-9 rounded-full px-4 text-[13px]"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            {t('verification.verify')}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              openReject({
                                kind: 'property',
                                id: String(r._id),
                                title,
                                subtitle: String(property?.propertyId ?? ''),
                              })
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-notVerified/30 px-4 text-[13px] font-semibold text-notVerified transition-colors hover:bg-notVerified/10"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                            {t('verification.reject')}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : agentRows.length === 0 ? (
        <div className="studio-card">
          <EmptyState
            illustration="/no_content_illustration_v4.svg"
            title={t('verification.noPendingAgents')}
            description={t('verification.noPendingAgentsDesc')}
            compact
          />
        </div>
      ) : (
        <div className="space-y-3">
          {agentRows.map((agent) => {
            const name = `${agent.firstName} ${agent.lastName}`.trim();
            const verified = agent.verificationStatus === 'VERIFIED';
            return (
              <div
                key={agent.id}
                ref={(node) => {
                  agentRowRefs.current[agent.id] = node;
                }}
                className={`studio-card scroll-mt-24 p-4 transition-shadow ${
                  focusedRowId === agent.id ? 'ring-2 ring-brand-500 ring-offset-2' : ''
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                      {initialsOf(agent.firstName, agent.lastName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-body font-semibold text-gray-900">{name}</p>
                      <p className="truncate text-xs text-gray-400">
                        {[agent.agencyName, agent.agentCode].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${agentStatusStyle(agent.verificationStatus)}`}>
                        {t('verification.agentStatus', { status: agent.verificationStatus })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {t('verification.registeredOn', { date: formatDate(agent.createdAt) ?? '—' })}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">{t('verification.licenseNumber')}</p>
                        <p className="text-[13px] font-medium text-gray-800">{agent.licenseNumber || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">{t('verification.province')}</p>
                        <p className="text-[13px] font-medium text-gray-800">{agent.province?.name ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">{t('dashboard.properties')}</p>
                        <p className="text-[13px] font-medium text-gray-800">{formatNumber(agent.totalProperties)}</p>
                      </div>
                    </div>

                    <ContactActions
                      phone={agent.phone}
                      email={agent.email}
                      name={name}
                      message={t('verification.agentWhatsappMessage', { title: name })}
                    />

                    {!verified ? (
                      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void approve({ kind: 'agent', id: agent.id, title: name, subtitle: agent.agentCode ?? '' })}
                          className="btn-primary h-9 rounded-full px-4 text-[13px]"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          {t('verification.verify')}
                        </button>
                        <button
                          type="button"
                          onClick={() => openReject({ kind: 'agent', id: agent.id, title: name, subtitle: agent.agentCode ?? '' })}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-notVerified/30 px-4 text-[13px] font-semibold text-notVerified transition-colors hover:bg-notVerified/10"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          {t('verification.reject')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        title={t('verification.rejectTitle')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-gray-500">{t('verification.rejectDesc')}</p>
          <p className="truncate rounded-lg bg-gray-50 p-3 text-sm font-semibold text-gray-900">{rejectTarget?.title}</p>
          <div>
            <label htmlFor="reject-reason" className="label">
              {t('verification.reason')} *
            </label>
            <textarea
              id="reject-reason"
              rows={4}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setActionError(null);
              }}
              placeholder={t('verification.reasonPlaceholder')}
              className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-surface px-3.5 py-2.5 text-body text-gray-900 outline-none focus:border-brand-500"
            />
            <p className="mt-1.5 text-xs text-gray-400">{t('verification.reasonHint')}</p>
          </div>
          {actionError ? (
            <p role="alert" className="rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">
              {actionError}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setRejectTarget(null)} className="btn-outline">
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={submitting || !reason.trim()}
              onClick={() => void reject()}
              className="inline-flex items-center gap-2 rounded-full bg-notVerified px-4 py-2.5 text-ui font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {submitting ? t('common.loading') : t('verification.confirmReject')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
