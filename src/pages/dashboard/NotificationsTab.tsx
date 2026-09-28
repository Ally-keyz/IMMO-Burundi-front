import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  CreditCard,
  FileText,
  Heart,
  Home,
  Megaphone,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { timeAgo } from '../../lib/format';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

/** Icon per notification type so the feed is scannable instead of a wall of bells. */
const TYPE_ICONS: Record<string, JSX.Element> = {
  NEW_ENQUIRY: <MessageCircle className="h-4 w-4" aria-hidden="true" />,
  NEW_MESSAGE: <MessageCircle className="h-4 w-4" aria-hidden="true" />,
  NEW_VISIT_BOOKING: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
  VISIT_CONFIRMED: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
  VISIT_CANCELLED: <CalendarDays className="h-4 w-4" aria-hidden="true" />,
  NEW_RENTAL_APPLICATION: <FileText className="h-4 w-4" aria-hidden="true" />,
  RENTAL_APPLICATION_UPDATED: <FileText className="h-4 w-4" aria-hidden="true" />,
  PROPERTY_APPROVED: <BadgeCheck className="h-4 w-4" aria-hidden="true" />,
  PROPERTY_REJECTED: <BadgeCheck className="h-4 w-4" aria-hidden="true" />,
  PROPERTY_CORRECTION_REQUIRED: <FileText className="h-4 w-4" aria-hidden="true" />,
  PROPERTY_PUBLISHED: <Home className="h-4 w-4" aria-hidden="true" />,
  NEW_PROPERTY_SUBMITTED: <Home className="h-4 w-4" aria-hidden="true" />,
  NEW_VERIFICATION_REQUEST: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
  VERIFICATION_COMPLETED: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
  PAYMENT_RECEIVED: <CreditCard className="h-4 w-4" aria-hidden="true" />,
  PROMOTION_ACTIVATED: <Megaphone className="h-4 w-4" aria-hidden="true" />,
  FAVORITE_SOLD: <Heart className="h-4 w-4" aria-hidden="true" />,
  FAVORITE_RENTED: <Heart className="h-4 w-4" aria-hidden="true" />,
  FAVORITE_ARCHIVED: <Heart className="h-4 w-4" aria-hidden="true" />,
};

/** Unread rows get an accent tint; read rows stay neutral. */
const UNREAD_ICON_STYLE = 'bg-accent/25 text-gray-800';
const READ_ICON_STYLE = 'bg-gray-100 text-gray-600';

export default function NotificationsTab(): JSX.Element {
  const { t } = useLanguage();
  const { notifications, unreadCount, isLoading, markAllRead, markRead } = useNotifications();
  const [detail, setDetail] = useState<(typeof notifications)[number] | null>(null);

  const open = (n: (typeof notifications)[number]) => {
    setDetail(n);
    if (!n.read) void markRead(n._id);
  };

  const propertyId = String(detail?.data?.propertyId ?? '');
  const link = propertyId ? `/property/${propertyId}` : '';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-gray-500">
          {unreadCount} {t('notification.unread')}
        </p>
        {unreadCount > 0 ? (
          <button type="button" onClick={() => void markAllRead()} className="btn-outline">
            {t('notification.markAllRead')}
          </button>
        ) : null}
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState illustration="/no_content_illustration_v4.svg" title={t('empty.noNotifications')} description={t('empty.noNotificationsDesc')} />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n._id}>
              <button
                type="button"
                onClick={() => open(n)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-gray-50 ${
                  n.read ? 'border-gray-200' : 'border-accent/25 bg-accent/[0.04]'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    n.read ? READ_ICON_STYLE : UNREAD_ICON_STYLE
                  }`}
                >
                  {TYPE_ICONS[n.type] ?? <Bell className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-gray-900">{n.title}</span>
                  {n.message ? <span className="mt-0.5 block text-[13px] text-gray-500">{n.message}</span> : null}
                  <span className="mt-1 block text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.title ?? ''} size="sm">
        <div className="space-y-4">
          {detail ? <p className="text-sm text-gray-700">{detail.message}</p> : null}
          {detail ? <p className="text-xs text-gray-400">{timeAgo(detail.createdAt)}</p> : null}
          {link ? (
            <Link to={link} onClick={() => setDetail(null)} className="btn-primary w-full">
              {t('applications.viewProperty')}
            </Link>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
