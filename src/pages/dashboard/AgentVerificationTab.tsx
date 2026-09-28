import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Building2, Check, CircleDashed, FileText, ShieldCheck, X } from 'lucide-react';
import type { AgentVerificationItemDTO, VerificationRequirementDTO } from '@immo/shared-types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getApiErrorMessage, verificationApi } from '../../lib/api';
import { formatDate } from '../../lib/format';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Modal from '../../components/Modal';

/** A property can only enter the verification queue once it is out of draft. */
const VERIFIABLE_STATUSES = ['APPROVED', 'PUBLISHED', 'UNDER_REVIEW', 'SUBMITTED'];

function isVerified(item: AgentVerificationItemDTO): boolean {
  return item.verificationStatus === 'VERIFIED' || item.verificationStatus === 'FULLY_VERIFIED';
}

function isPending(item: AgentVerificationItemDTO): boolean {
  return Boolean(item.activeRequest?.isPending);
}

/** Outstanding items first: a rejection note outranks a merely missing document. */
function needsAction(item: AgentVerificationItemDTO): boolean {
  if (isVerified(item)) return false;
  return item.missingCount > 0 || item.needsCorrection || Boolean(item.adminNote) || Boolean(item.rejectionReason);
}

function verificationStyle(status: string): string {
  if (status === 'VERIFIED' || status === 'FULLY_VERIFIED') return 'bg-verified/10 text-verified';
  if (status === 'PARTIAL') return 'bg-accent/20 text-gray-800';
  return 'bg-gray-100 text-gray-600';
}

function propertyStatusStyle(status: string): string {
  if (status === 'PUBLISHED') return 'bg-verified/10 text-verified';
  if (status === 'NEEDS_CORRECTION' || status === 'REJECTED' || status === 'SUSPENDED')
    return 'bg-notVerified/10 text-notVerified';
  if (status === 'DRAFT' || status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'APPROVED')
    return 'bg-accent/20 text-gray-800';
  return 'bg-gray-100 text-gray-600';
}

export default function AgentVerificationTab(): JSX.Element {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [items, setItems] = useState<AgentVerificationItemDTO[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, verified: 0, needsAction: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AgentVerificationItemDTO | null>(null);

  const [requesting, setRequesting] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestDone, setRequestDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verificationApi.portfolio();
      setItems(res.items ?? []);
      setSummary(res.summary ?? { total: 0, pending: 0, verified: 0, needsAction: 0 });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = useMemo(() => {
    const pending = items.filter((i) => isPending(i));
    const verified = items.filter((i) => isVerified(i) && !isPending(i));
    const action = items.filter((i) => !isPending(i) && !isVerified(i) && needsAction(i));
    /* Anything neither verified nor in the queue and with nothing to fix. */
    const settled = items.filter((i) => !isPending(i) && !isVerified(i) && !needsAction(i));
    return { pending, verified, action, settled };
  }, [items]);

  const openRequest = () => {
    setRequestError(null);
    setRequestDone(null);
    setRequestNote('');
  };

  const submitRequest = async () => {
    if (!detail) return;
    setRequestBusy(true);
    setRequestError(null);
    try {
      const res = await verificationApi.createRequest(detail.propertyId, requestNote.trim() || undefined);
      setRequestDone(String((res as { verificationCode?: string })?.verificationCode ?? ''));
      await load();
    } catch (err) {
      setRequestError(getApiErrorMessage(err));
    } finally {
      setRequestBusy(false);
    }
  };

  const canRequest = (item: AgentVerificationItemDTO) =>
    !isPending(item) && VERIFIABLE_STATUSES.includes(item.propertyStatus);

  const requirementLabel = (req: VerificationRequirementDTO): string => {
    const key = `verifyReq.${req.key}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
    return req.label ?? req.key;
  };

  const renderItem = (item: AgentVerificationItemDTO) => {
    const missing = item.requirements.filter((r) => r.status === 'MISSING');
    return (
      <li key={item.propertyId}>
        <button
          type="button"
          onClick={() => setDetail(item)}
          className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50/60"
        >
          {item.thumbUrl ? (
            <img src={item.thumbUrl} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${verificationStyle(item.verificationStatus)}`}>
                {item.verificationStatus}
              </span>
              {item.activeRequest ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                  {isPending(item) ? <CircleDashed className="h-3 w-3" aria-hidden="true" /> : null}
                  {item.activeRequest.status}
                </span>
              ) : null}
            </p>
            <p className="mt-1 truncate text-body font-semibold text-gray-900">{item.title}</p>
            <p className="truncate text-xs text-gray-400">
              {item.listingType} · {item.propertyType}
              {missing.length > 0 ? ` · ${missing.length} ${t('dashboard.verificationCount')}` : ''}
            </p>
          </div>
        </button>
      </li>
    );
  };

  const renderSection = (heading: string, list: AgentVerificationItemDTO[], empty: string) => (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-gray-900">
        {heading}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">{list.length}</span>
      </h2>
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-4 text-[13px] text-gray-500">{empty}</p>
      ) : (
        <ul className="space-y-2">{list.map(renderItem)}</ul>
      )}
    </section>
  );

  const missingOf = (item: AgentVerificationItemDTO) => item.requirements.filter((r) => r.status === 'MISSING');
  const metOf = (item: AgentVerificationItemDTO) => item.requirements.filter((r) => r.status === 'MET');

  return (
    <div>
      <h1 className="page-title mb-2">{t('dashboard.verification')}</h1>
      <p className="mb-6 max-w-3xl text-[13px] leading-relaxed text-gray-500">{t('dashboard.verificationIntro')}</p>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: t('dashboard.properties'), value: summary.total, tone: 'text-gray-900' },
          { label: t('dashboard.verificationPendingSection'), value: summary.pending, tone: 'text-gray-900' },
          { label: t('dashboard.verificationVerifiedSection'), value: summary.verified, tone: 'text-verified' },
          { label: t('dashboard.verificationActionSection'), value: summary.needsAction, tone: 'text-notVerified' },
        ].map((stat) => (
          <div key={stat.label} className="studio-card px-4 py-3">
            <p className="truncate text-xs text-gray-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title={t('error.loadFailed')} message={error} onRetry={() => void load()} retryLabel={t('error.retry')} />
      ) : items.length === 0 ? (
        <div className="studio-card">
          <EmptyState
            illustration="/no_content_illustration_v4.svg"
            title={t('dashboard.verificationEmpty')}
            actionLabel={t('dashboard.verificationEmptyCta')}
            onAction={() => navigate('/dashboard?tab=myProperties')}
          />
        </div>
      ) : (
        <>
          {renderSection(t('dashboard.verificationPendingSection'), sections.pending, t('dashboard.verificationNoPending'))}
          {renderSection(t('dashboard.verificationActionSection'), sections.action, t('dashboard.verificationNoAction'))}
          {renderSection(t('dashboard.verificationVerifiedSection'), sections.verified, t('dashboard.verificationNoVerified'))}
          {sections.settled.length > 0
            ? renderSection(t('dashboard.verified'), sections.settled, '')
            : null}
        </>
      )}

      {/* ── Detail drawer ─────────────────────────────────── */}
      <Modal
        open={detail !== null}
        onClose={() => {
          setDetail(null);
          openRequest();
        }}
        title={detail?.title ?? t('dashboard.verification')}
        size="lg"
        headerDivider
      >
        {detail ? (
          <div className="space-y-5">
            {detail.thumbUrl ? (
              <img src={detail.thumbUrl} alt={detail.title} className="h-44 w-full rounded-xl object-cover" />
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${verificationStyle(detail.verificationStatus)}`}>
                {detail.verificationStatus}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${propertyStatusStyle(detail.propertyStatus)}`}>
                {detail.propertyStatus}
              </span>
              <span className="text-xs text-gray-400">{detail.listingType} · {detail.propertyType}</span>
            </div>

            {detail.verificationCode ? (
              <p className="text-xs text-gray-500">
                {t('dashboard.verificationCode')}: <span className="font-semibold text-gray-800">{detail.verificationCode}</span>
                {detail.verifiedAt ? ` · ${formatDate(detail.verifiedAt)}` : ''}
              </p>
            ) : null}

            {/* The administration decides — surface its verdict first. */}
            {detail.adminNote ? (
              <div className="rounded-xl border border-notVerified/20 bg-notVerified/5 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-notVerified">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('dashboard.verificationAdminNote')}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-800">{detail.adminNote}</p>
              </div>
            ) : null}

            {detail.rejectionReason ? (
              <div className="rounded-xl border border-notVerified/20 bg-notVerified/5 p-3.5">
                <p className="text-xs font-semibold text-notVerified">{t('dashboard.verificationReviewNote')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-800">{detail.rejectionReason}</p>
              </div>
            ) : null}

            {detail.reviewNote && detail.reviewNote !== detail.rejectionReason ? (
              <div className="rounded-xl bg-gray-50 p-3.5">
                <p className="text-xs font-semibold text-gray-500">{t('dashboard.verificationReviewNote')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-800">{detail.reviewNote}</p>
              </div>
            ) : null}

            {detail.activeRequest ? (
              <div className="rounded-xl border border-gray-200 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">{t('dashboard.requestVerification')}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                    {detail.activeRequest.status}
                  </span>
                </div>
                <dl className="mt-2 space-y-1 text-[13px] text-gray-600">
                  <div className="flex gap-2">
                    <dt className="text-gray-400">{t('dashboard.verificationCode')}</dt>
                    <dd className="font-medium text-gray-800">{detail.activeRequest.verificationCode}</dd>
                  </div>
                  {detail.activeRequest.requestedAt ? (
                    <div className="flex gap-2">
                      <dt className="text-gray-400">{t('dashboard.verificationRequestedOn')}</dt>
                      <dd>{formatDate(detail.activeRequest.requestedAt)}</dd>
                    </div>
                  ) : null}
                  {detail.activeRequest.assignedOfficerName ? (
                    <div className="flex gap-2">
                      <dt className="text-gray-400">{t('dashboard.verificationReviewedBy')}</dt>
                      <dd>{detail.activeRequest.assignedOfficerName}</dd>
                    </div>
                  ) : null}
                </dl>
                {detail.activeRequest.rejectionReason ? (
                  <p className="mt-2 rounded-lg bg-notVerified/10 p-2.5 text-[13px] text-notVerified">
                    {detail.activeRequest.rejectionReason}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* What to update for the property to be accepted. */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">{t('dashboard.verificationWhatToUpdate')}</h3>
              {missingOf(detail).length === 0 ? (
                <p className="flex items-start gap-2 rounded-xl bg-verified/5 p-3 text-[13px] text-verified">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {t('dashboard.verificationAllMet')}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {missingOf(detail).map((req) => (
                    <li key={req.key} className="flex items-start gap-2.5 rounded-lg bg-notVerified/5 p-2.5">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-notVerified" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-gray-900">{requirementLabel(req)}</p>
                        <p className="text-[11px] text-notVerified">{t('dashboard.verificationMissing')}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {metOf(detail).length > 0 ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[13px] font-medium text-gray-500">
                    {metOf(detail).length} {t('dashboard.verificationProvided')}
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {metOf(detail).map((req) => (
                      <li key={req.key} className="flex items-start gap-2.5 rounded-lg bg-gray-50 p-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-verified" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-gray-900">{requirementLabel(req)}</p>
                          {req.fileName ? <p className="truncate text-[11px] text-gray-400">{req.fileName}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>

            {/* Attached documents. */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">{t('dashboard.verificationDocuments')}</h3>
              {detail.documents.length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-3 text-[13px] text-gray-500">{t('dashboard.verificationNoDocuments')}</p>
              ) : (
                <ul className="space-y-1.5">
                  {detail.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-gray-900">
                          {t(`verifyReq.document.${doc.documentType}`) === `verifyReq.document.${doc.documentType}`
                            ? doc.documentType
                            : t(`verifyReq.document.${doc.documentType}`)}
                        </p>
                        {doc.fileName ? <p className="truncate text-[11px] text-gray-400">{doc.fileName}</p> : null}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${verificationStyle(doc.verificationStatus === 'VERIFIED' ? 'VERIFIED' : doc.verificationStatus)}`}>
                        {doc.verificationStatus}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-[12px] leading-relaxed text-gray-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('dashboard.verificationAdminDecides')}
            </p>

            {/* Request verification — also available per property in "My properties". */}
            {requestDone ? (
              <div className="flex items-center gap-3 rounded-xl border border-verified/20 bg-verified/5 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verified text-white">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t('dashboard.verificationRequested')}</p>
                  <p className="text-xs text-gray-500">
                    {t('dashboard.verificationCode')}: {requestDone}
                  </p>
                </div>
              </div>
            ) : canRequest(detail) ? (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label htmlFor="verify-request-note" className="label">
                    {t('dashboard.verificationNote')}
                  </label>
                  <textarea
                    id="verify-request-note"
                    rows={3}
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder={t('dashboard.verificationNotePlaceholder')}
                    className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-surface px-3.5 py-2.5 text-body text-gray-900 outline-none focus:border-brand-500"
                  />
                </div>
                {requestError ? (
                  <p role="alert" className="rounded-lg bg-notVerified/10 p-3 text-sm text-notVerified">
                    {requestError}
                  </p>
                ) : null}
                <div className="flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setDetail(null)} className="btn-outline">
                    {t('common.close')}
                  </button>
                  <button type="button" disabled={requestBusy} onClick={() => void submitRequest()} className="btn-primary">
                    {requestBusy ? t('common.loading') : t('dashboard.requestVerification')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <></>
        )}
      </Modal>
    </div>
  );
}
