import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Building2, Check, MessageCircle, Phone, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { agentPropertiesApi, agentsApi, visitsApi, enquiriesApi, dealsApi } from '../../lib/api';
import { formatNumber, timeAgo } from '../../lib/format';
import { invalidateRailCounts } from '../../lib/railCounts';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

type BookingRow = Record<string, unknown>;
type EnquiryRow = Record<string, unknown>;

interface AgentIdentity {
  id: string;
}

function person(obj: unknown): any {
  return obj && typeof obj === 'object' ? obj : undefined;
}

function whatsAppUrl(phone: string, name: string, propertyTitle: string): string {
  const digits = (phone || '').replace(/[^\d]/g, '');
  const text = encodeURIComponent(`Hi ${name}, I'm writing about "${propertyTitle}" on IMMO BURUNDI.`);
  return `https://wa.me/${digits}?text=${text}`;
}

function initialsOf(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U';
}

export default function BookingsInquiriesTab(): JSX.Element {
  const { t } = useLanguage();

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [subTab, setSubTab] = useState<'viewings' | 'buying' | 'messages'>('viewings');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [dealTarget, setDealTarget] = useState<{
    kind: 'booking' | 'enquiry';
    id: string;
    title: string;
    requesterId: string;
    requesterName: string;
    propertyId: string;
    amount?: number;
    currency?: string;
  } | null>(null);
  const [dealSaving, setDealSaving] = useState(false);
  const [paidTarget, setPaidTarget] = useState<{ kind: 'booking' | 'enquiry'; id: string; title: string } | null>(null);
  const [paidSaving, setPaidSaving] = useState(false);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const rows: BookingRow[] = [];
    const agent: AgentIdentity | null = await agentsApi.me().catch(() => null);
    if (agent) {
      const res = await agentPropertiesApi.list({ page: 1, pageSize: 50 });
      for (const p of res.items) {
        const pId = p.id || p._id;
        try {
          const propBookings = await visitsApi.getPropertyBookings(pId);
          rows.push(...propBookings.items.map((b) => ({ ...b, propId: pId, propTitle: p.title, propPhoto: p.media?.[0]?.thumbUrl ?? p.media?.[0]?.url ?? '' })));
        } catch {
          /* skip */
        }
      }
    }
    setBookings(rows);
    setEnquiries(await enquiriesApi.inbox().catch(() => []));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dealStatus = (status: string): boolean =>
    status === 'COMPLETED' || status === 'DEAL_AGREED';

  const statusLabel = (kind: 'booking' | 'enquiry', status: string): string =>
    kind === 'enquiry' ? t(`enquiry.status.${status}`) : t(`booking.status.${status}`);

  const statusChip = (status: string) =>
    dealStatus(status)
      ? 'bg-verified/10 text-verified'
      : status === 'CANCELLED' || status === 'NO_SHOW' || status === 'CLOSED'
        ? 'bg-gray-100 text-gray-500 line-through'
        : status === 'CONFIRMED' || status === 'RESPONDED'
          ? 'bg-verified/10 text-verified'
          : 'bg-notVerified/10 text-notVerified';

  const isPaid = (row: BookingRow | EnquiryRow): boolean => Boolean((row as any).paidAt);

  const confirmDeal = async () => {
    if (!dealTarget) return;
    setDealSaving(true);
    try {
      if (dealTarget.kind === 'booking') {
        await visitsApi.updateBookingStatus(dealTarget.id, 'COMPLETED');
      } else {
        await enquiriesApi.setStatus(dealTarget.id, 'DEAL_AGREED');
      }
      await load();
      /* An answered enquiry leaves the inbox badge. */
      invalidateRailCounts();
      setDealTarget(null);
    } finally {
      setDealSaving(false);
    }
  };

  const confirmPaid = async () => {
    if (!paidTarget) return;
    setPaidSaving(true);
    try {
      await dealsApi.markPaid({ kind: paidTarget.kind, id: paidTarget.id });
      await load();
      setPaidTarget(null);
    } finally {
      setPaidSaving(false);
    }
  };

  const rowActions = (
    kind: 'booking' | 'enquiry',
    requesterId: string,
    requesterName: string,
    requesterPhone: string,
    propertyId: string,
    propTitle: string,
    row: BookingRow | EnquiryRow,
    status: string,
  ) => {
    return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {requesterPhone ? (
        <>
          <button
            type="button"
            onClick={() => setRevealedPhones((r) => ({ ...r, [requesterId]: !r[requesterId] }))}
            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {revealedPhones[requesterId] ? requesterPhone : t('dashboard.contact')}
          </button>
          {requesterPhone.replace(/[^\d]/g, '') ? (
            <a
              href={whatsAppUrl(requesterPhone, requesterName, propTitle)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#25D366]/10 px-3 text-[13px] font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/20"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.whatsApp')}
            </a>
          ) : null}
        </>
      ) : null}
      {dealStatus(status) && requesterId && propertyId ? (
        isPaid(row) ? (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-verified/10 px-3 text-[13px] font-semibold text-verified">
            <Check className="h-4 w-4" aria-hidden="true" />
            {t('dashboard.paid')}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setPaidTarget({ kind, id: String(row._id ?? ''), title: propTitle })}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-verified px-3 text-[13px] font-semibold text-white transition-colors hover:bg-verified/90"
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            {t('dashboard.markPaid')}
          </button>
        )
      ) : status === 'PENDING' || status === 'NEW' || status === 'OPEN' || status === 'IN_PROGRESS' ? (
        <button
          type="button"
          onClick={() =>
            setDealTarget({
              kind,
              id: String(row._id ?? ''),
              title: propTitle,
              requesterId,
              requesterName,
              propertyId,
            })
          }
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 px-3 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          {t('dashboard.markDeal')}
        </button>
      ) : null}
    </div>
    );
  };

  /* Viewing requests */
  const viewingRows = bookings.filter((b) => (statusFilter === 'ALL' ? true : String(b.status) === statusFilter));
  const viewingStatuses = useMemo(() => Array.from(new Set(bookings.map((b) => String(b.status)))), [bookings]);

  /* Buying requests */
  const buyingRows = enquiries.filter((e) => (statusFilter === 'ALL' ? true : String(e.status) === statusFilter));
  const buyingStatuses = useMemo(() => Array.from(new Set(enquiries.map((e) => String(e.status)))), [enquiries]);

  /* Messages */
  const contacts = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; photo?: string; property: string; propertyId: string; at: string }>();
    for (const b of bookings) {
      const u: any = person(b.userId);
      const id = String(u?._id ?? '');
      if (id && u) {
        const prev = map.get(id);
        const when = String(b.createdAt ?? '');
        map.set(id, {
          name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—',
          phone: String(u.phone ?? ''),
          photo: String(u.photoUrl ?? ''),
          property: String(b.propTitle ?? ''),
          propertyId: String(b.propId ?? ''),
          at: prev && prev.at > when ? prev.at : when,
        });
      }
    }
    for (const e of enquiries) {
      const s: any = e.sender;
      const prop: any = e.property;
      const id = String(s?._id ?? '');
      if (id && s) {
        const when = String(e.createdAt ?? '');
        map.set(id, {
          name: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || '—',
          phone: String(s.phone ?? ''),
          photo: String(s.photoUrl ?? ''),
          property: String(prop?.title ?? ''),
          propertyId: String(prop?._id ?? ''),
          at: when,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [bookings, enquiries]);

  const statusOptions = subTab === 'viewings' ? viewingStatuses : subTab === 'buying' ? buyingStatuses : [];
  const hasFilters = statusFilter !== 'ALL';

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex items-center gap-5 border-b border-gray-200">
        {(
          [
            { id: 'viewings', label: t('dashboard.tabBookings') },
            { id: 'buying', label: t('dashboard.tabEnquiries') },
            { id: 'messages', label: t('dashboard.tabMessages') },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSubTab(tab.id);
              setStatusFilter('ALL');
            }}
            className="studio-tab"
            aria-selected={subTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 py-3">
        {statusOptions.length > 1 ? (
          <>
            <label className="relative">
              <span className="sr-only">{t('dashboard.colStatus')}</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="chip h-9 cursor-pointer pr-8"
              >
                <option value="ALL">{t('dashboard.allStatuses')}</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(subTab === 'buying' ? 'enquiry' : 'booking', s)}
                  </option>
                ))}
              </select>
            </label>
            {hasFilters ? (
              <span className="chip chip-active">
                {statusLabel(subTab === 'buying' ? 'enquiry' : 'booking', statusFilter)}
                <button type="button" onClick={() => setStatusFilter('ALL')} aria-label="Remove filter" className="flex h-4 w-4 items-center justify-center rounded-full text-gray-500 hover:text-gray-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null}
            {hasFilters ? (
              <button type="button" onClick={() => setStatusFilter('ALL')} className="inline-flex h-8 items-center gap-1 px-2 text-[13px] font-medium text-gray-600 hover:text-gray-900">
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t('dashboard.clearFilters')}
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}</div>
      ) : subTab === 'viewings' ? (
        viewingRows.length === 0 ? (
          <EmptyState
            illustration="/no_content_illustration_v4.svg"
            title={t('dashboard.noInbox')}
            description={t('dashboard.noInboxDesc')}
          />
        ) : (
          <div className="studio-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-[13px] text-gray-500">
                    <th className="px-4 py-3 font-medium">{t('dashboard.requester')}</th>
                    <th className="px-4 py-3 font-medium">{t('dashboard.property')}</th>
                    <th className="px-4 py-3 font-medium">{t('dashboard.colListed')}</th>
                    <th className="px-4 py-3 font-medium">{t('dashboard.colStatus')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {viewingRows.map((b) => {
                    const u: any = person(b.userId);
                    const requesterId = String(u?._id ?? '');
                    const requesterName = u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '—';
                    const requesterPhone = String(u?.phone ?? '');
                    const photo = String(u?.photoUrl ?? '');
                    const when = `${String((b.visitSessionId as any)?.date ?? b.preferredDate ?? '')}${b.startTime ? ` · ${String(b.startTime)}` : ''}` || '—';
                    const status = String(b.status ?? 'PENDING');
                    return (
                      <tr key={String(b._id ?? '')} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {photo ? (
                              <img src={photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                                {initialsOf(u?.firstName, u?.lastName)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-body font-medium text-gray-900">{requesterName}</p>
                              <p className="text-xs text-gray-400">{String(b.bookingReference ?? '')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            {b.propPhoto ? (
                              <img src={String(b.propPhoto)} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                <Building2 className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                            <p className="max-w-[220px] truncate text-body font-medium text-gray-800">{String(b.propTitle ?? '')}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-gray-500">{when}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusChip(status)}`}>
                            {statusLabel('booking', status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {rowActions('booking', requesterId, requesterName, requesterPhone, String(b.propId ?? ''), String(b.propTitle ?? ''), b, status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : subTab === 'buying' ? (
        buyingRows.length === 0 ? (
          <EmptyState
            illustration="/no_content_illustration_v4.svg"
            title={t('dashboard.noInbox')}
            description={t('dashboard.noInboxDesc')}
          />
        ) : (
          <div className="studio-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-[13px] text-gray-500">
                    <th className="px-4 py-3 font-medium">{t('dashboard.requester')}</th>
                    <th className="px-4 py-3 font-medium">{t('dashboard.property')}</th>
                    <th className="px-4 py-3 font-medium">{t('dashboard.colInquiries')}</th>
                    <th className="px-4 py-3 font-medium">{t('dashboard.colStatus')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {buyingRows.map((e) => {
                    const s: any = e.sender;
                    const prop: any = e.property;
                    const requesterId = String(s?._id ?? '');
                    const requesterName = s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() : '—';
                    const requesterPhone = String(s?.phone ?? '');
                    const photo = String(s?.photoUrl ?? '');
                    const propTitle = String(prop?.title ?? '');
                    const price: any = prop?.price;
                    const offer = price && typeof price === 'object' ? `${formatNumber(Number(price.amount))} ${String(price.currency ?? '')}` : '—';
                    const status = String(e.status ?? 'NEW');
                    return (
                      <tr key={String(e._id ?? '')} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {photo ? (
                              <img src={photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                                {initialsOf(s?.firstName, s?.lastName)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-body font-medium text-gray-900">{requesterName}</p>
                              <p className="text-xs text-gray-400">{timeAgo(String(e.createdAt ?? ''))}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            {prop?.media?.[0]?.thumbUrl ? (
                              <img src={prop.media[0].thumbUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                <Building2 className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                            <p className="max-w-[220px] truncate text-body font-medium text-gray-800">{propTitle}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-[260px] truncate text-[13px] text-gray-600">{String(e.subject ?? e.message ?? '')}</p>
                          <p className="text-[13px] font-semibold text-gray-900">{offer}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusChip(status)}`}>
                            {statusLabel('enquiry', status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {rowActions('enquiry', requesterId, requesterName, requesterPhone, String(prop?._id ?? ''), propTitle, e, status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : contacts.length === 0 ? (
        <EmptyState
          illustration="/start_searching_dark.svg"
          title={t('dashboard.noInbox')}
          description={t('dashboard.noInboxDesc')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 desktop:grid-cols-3">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              {c.photo ? (
                <img src={c.photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {initialsOf(c.name.split(' ')[0], c.name.split(' ')[1])}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-semibold text-gray-900">{c.name}</p>
                <p className="truncate text-xs text-gray-500">{c.property}</p>
              </div>
              {c.phone.replace(/[^\d]/g, '') ? (
                <a
                  href={whatsAppUrl(c.phone, c.name, c.property)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/10 text-[#128C7E] transition-colors hover:bg-[#25D366]/20"
                  aria-label={t('dashboard.whatsApp')}
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Deal-agreed confirm */}
      <Modal open={dealTarget !== null} onClose={() => setDealTarget(null)} title={t('deal.title')} size="sm">
        <p className="text-body text-gray-600">{t('deal.desc')}</p>
        <p className="mt-2 truncate text-sm font-semibold text-gray-900">{dealTarget?.title}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={() => setDealTarget(null)} className="btn-outline">
            {t('common.cancel')}
          </button>
          <button type="button" disabled={dealSaving} onClick={() => void confirmDeal()} className="btn-primary">
            {dealSaving ? t('common.loading') : t('deal.confirm')}
          </button>
        </div>
      </Modal>

      {/* Mark deal as paid */}
      <Modal open={paidTarget !== null} onClose={() => setPaidTarget(null)} title={t('paid.title')} size="sm">
        <p className="text-body text-gray-600">{t('paid.desc')}</p>
        <p className="mt-2 truncate text-sm font-semibold text-gray-900">{paidTarget?.title}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={() => setPaidTarget(null)} className="btn-outline">
            {t('common.cancel')}
          </button>
          <button type="button" disabled={paidSaving} onClick={() => void confirmPaid()} className="btn-primary">
            {paidSaving ? t('common.loading') : t('paid.confirm')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

