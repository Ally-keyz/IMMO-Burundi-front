import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Clock, DoorOpen } from 'lucide-react';
import type { VisitSession } from '../lib/api';
import { visitsApi, getApiErrorMessage } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { countdown, formatDate } from '../lib/format';

interface VisitWidgetProps {
  propertyId: string;
}

interface CapacityUpdate {
  sessionId: string;
  capacity?: number;
  bookedCount?: number;
}

export default function VisitWidget({ propertyId }: VisitWidgetProps): JSX.Element {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<VisitSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingMsg, setBookingMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [, setNow] = useState(Date.now());

  /* refresh the countdown every 30s */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await visitsApi.getSessions(propertyId);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:property', propertyId);

    const onCapacity = (payload: CapacityUpdate) => {
      if (!payload?.sessionId) return;
      setSessions((prev) =>
        prev.map((s) =>
          s._id === payload.sessionId
            ? {
                ...s,
                capacity: payload.capacity ?? s.capacity,
                bookedCount: payload.bookedCount ?? s.bookedCount,
                capacityRemaining: Math.max(0, (payload.capacity ?? s.capacity) - (payload.bookedCount ?? s.bookedCount)),
                isFull: (payload.bookedCount ?? s.bookedCount) >= (payload.capacity ?? s.capacity),
              }
            : s,
        ),
      );
    };
    socket.on('visit:capacityUpdate', onCapacity);
    return () => {
      socket.emit('leave:property', propertyId);
      socket.off('visit:capacityUpdate', onCapacity);
    };
  }, [propertyId]);

  const book = useCallback(
    async (sessionId: string) => {
      setBookingMsg(null);
      if (!isAuthenticated) {
        navigate('/login', { state: { from: `/property/${propertyId}` } });
        return;
      }
      try {
        const result = await visitsApi.book(sessionId);
        setBookingId(sessionId);
        setBookingMsg({ ok: true, text: `${t('visit.bookedSuccess')} (${result.bookingReference})` });
        void load(); /* refresh capacities after booking */
      } catch (err) {
        setBookingMsg({ ok: false, text: `${t('visit.bookError')} ${getApiErrorMessage(err)}` });
      }
    },
    [isAuthenticated, navigate, propertyId, t, load],
  );

  if (loading) {
    return (
      <div className="card animate-pulse p-6">
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="mt-4 space-y-3">
          <div className="h-16 rounded-xl bg-gray-100" />
          <div className="h-16 rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <section className="card p-6" aria-label={t('visit.bookVisit')}>
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
        <CalendarClock className="h-5 w-5 text-brand-600" aria-hidden="true" />
        {t('visit.bookVisit')}
      </h2>

      {error ? (
        <p className="mt-4 text-sm text-notVerified">{error}</p>
      ) : sessions.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{t('visit.noSessions')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {sessions.map((session) => {
            const pct = session.capacity > 0 ? Math.min(100, Math.round((session.bookedCount / session.capacity) * 100)) : 0;
            const isOwnBooking = bookingId === session._id;
            const now = Date.now();
            const deadline = new Date(session.bookingDeadline).getTime();
            const closed = !Number.isNaN(deadline) && deadline <= now;

            return (
              <li key={session._id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    {formatDate(session.date)} · {session.startTime}
                  </span>
                  <span
                    className={`text-xs font-medium ${session.isFull ? 'text-notVerified' : 'text-verified'}`}
                  >
                    {session.capacityRemaining} / {session.capacity} {t('visit.placesRemaining')}
                  </span>
                </div>

                {/* Capacity bar — always has a text label alongside */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${session.isFull ? 'bg-notVerified' : 'bg-verified'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500" role="status">
                    <DoorOpen className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    {t('visit.bookingClosesIn')}: {countdown(session.bookingDeadline)}
                  </span>
                  <button
                    type="button"
                    disabled={session.isFull || closed}
                    onClick={() => void book(session._id)}
                    className={isOwnBooking ? 'btn-secondary' : 'btn-primary'}
                  >
                    {isOwnBooking
                      ? t('visit.booked')
                      : session.isFull
                        ? t('visit.sessionFull')
                        : t('visit.bookVisit')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {bookingMsg ? (
        <p
          role="alert"
          className={`mt-4 rounded-xl p-3 text-sm ${bookingMsg.ok ? 'bg-verified/10 text-verified' : 'bg-notVerified/10 text-notVerified'}`}
        >
          {bookingMsg.text}
        </p>
      ) : null}

      {!isAuthenticated ? (
        <p className="mt-4 text-xs text-gray-400">{t('visit.loginToBook')}</p>
      ) : null}
    </section>
  );
}