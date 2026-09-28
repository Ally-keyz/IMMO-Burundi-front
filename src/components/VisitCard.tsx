import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FileText, MessageCircle, Phone, Users } from 'lucide-react';
import type { PropertySummaryDTO } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAsyncData } from '../lib/useAsyncData';
import { propertiesApi, visitsApi } from '../lib/api';
import { invalidateRailCounts } from '../lib/railCounts';
import { telUrl, whatsappChatUrl } from '../lib/whatsapp';
import { timeAgo } from '../lib/format';
import PropertyCard from './PropertyCard';
import PropertyCardSkeleton from './PropertyCardSkeleton';
import Modal from './Modal';

type BookingRow = Record<string, unknown>;

interface VisitCardProps {
  booking: BookingRow;
  onChanged?: () => void;
}

function statusStyle(status: string): string {
  if (status === 'CONFIRMED') return 'bg-verified/10 text-verified';
  if (status === 'CANCELLED' || status === 'NO_SHOW') return 'bg-notVerified/10 text-notVerified';
  return 'bg-accent/20 text-gray-800';
}

function resolveProperty(booking: BookingRow): { id: string; title: string; photo: string } {
  const direct: any = booking.propertyId;
  const session: any = booking.visitSessionId;
  const nested: any = session?.propertyId;
  const prop: any = direct && typeof direct === 'object' ? direct : nested;
  const id = prop?._id ?? (typeof direct === 'string' ? direct : nested?._id ?? session?._id ?? '');
  const title = prop?.title ?? String(booking.propertyTitle ?? '');
  const photo = prop?.media?.[0]?.thumbUrl ?? prop?.media?.[0]?.url ?? String(booking.propertyPhoto ?? '');
  return { id: String(id), title, photo };
}

function bookingWhen(booking: BookingRow): string {
  const session: any = booking.visitSessionId;
  if (session && typeof session === 'object' && session.date) {
    return `${String(session.date)} · ${String(session.startTime ?? '')}`;
  }
  const when = String(booking.preferredDate ?? '');
  return booking.startTime ? `${when} · ${String(booking.startTime)}` : when || '—';
}

export default function VisitCard({ booking, onChanged }: VisitCardProps): JSX.Element {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const { id: propertyId, title, photo } = resolveProperty(booking);
  const property = useAsyncData<PropertySummaryDTO | null>(
    () => (propertyId ? propertiesApi.getOne(propertyId) : Promise.resolve(null)),
    [propertyId],
  );

  const bookingId = String(booking._id ?? '');
  const status = String(booking.status ?? 'PENDING');
  const statusLabel =
    status === 'CONFIRMED'
      ? t('visit.statusConfirmed')
      : status === 'CANCELLED'
        ? t('visit.statusCancelled')
        : status === 'NO_SHOW'
          ? t('visit.statusNoShow')
          : t('visit.statusPending');
  const when = bookingWhen(booking);
  const people = Number(booking.numberOfPeople ?? 1);
  const notes = String(booking.notes ?? '');
  const reference = String(booking.bookingReference ?? '');
  const bookedOn = String(booking.createdAt ?? '');

  const agentPhone = property.data?.agent?.phone;
  const chatUrl = whatsappChatUrl(agentPhone, t('contact.whatsappProperty', { title }));
  const callUrl = telUrl(agentPhone);

  const cancelVisit = async () => {
    try {
      await visitsApi.updateBookingStatus(bookingId, 'CANCELLED');
      invalidateRailCounts();
      onChanged?.();
      setOpen(false);
    } catch {
      /* keep modal open on failure */
    }
  };

  if (property.loading) return <PropertyCardSkeleton />;
  if (property.error || !property.data) {
    return (
      <article className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{title || t('dashboard.property')}</p>
          <p className="text-xs text-gray-500">{when}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>{statusLabel}</span>
      </article>
    );
  }

  return (
    <>
      <div className="relative">
        <PropertyCard property={property.data} onOpenDetail={() => setOpen(true)} />
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-soft ${statusStyle(status)}`}>{statusLabel}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-gray-950/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {when}
          </span>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('visit.detailsTitle')}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {photo ? (
              <img src={photo} alt={title} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                <CalendarDays className="h-6 w-6" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{property.data.title}</p>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(status)}`}>{statusLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">{t('visit.date')}</p>
              <p className="mt-0.5 font-semibold text-gray-900">{when}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">{t('visit.peopleCount')}</p>
              <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-gray-900">
                <Users className="h-4 w-4 text-gray-400" aria-hidden="true" />
                {people}
              </p>
            </div>
            {reference ? (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{t('visit.reference')}</p>
                <p className="mt-0.5 font-semibold text-gray-900">{reference}</p>
              </div>
            ) : null}
            {bookedOn ? (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{t('visit.bookedOn')}</p>
                <p className="mt-0.5 font-semibold text-gray-900">{timeAgo(bookedOn)}</p>
              </div>
            ) : null}
          </div>

          {notes ? (
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {t('visit.notes')}
              </p>
              <p className="mt-1 text-sm text-gray-800">{notes}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4">
            {status !== 'CANCELLED' && status !== 'NO_SHOW' ? (
              <button type="button" onClick={() => void cancelVisit()} className="btn-outline">
                {t('visit.cancelVisit')}
              </button>
            ) : null}
            {callUrl && agentPhone ? (
              <a href={callUrl} className="btn-outline">
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span className="font-mono">{agentPhone}</span>
              </a>
            ) : null}
            {chatUrl ? (
              <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {t('contact.whatsappCta')}
              </a>
            ) : null}
            <Link to={`/property/${property.data._id}`} className="btn-primary">
              {t('visit.viewProperty')}
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}