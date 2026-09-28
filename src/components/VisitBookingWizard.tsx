import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, Lock } from 'lucide-react';
import type { VisitSession } from '../lib/api';
import { visitsApi, getApiErrorMessage } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/format';
import type { PropertyMediaDTO } from '@immo/shared-types';
import DatePicker from './pickers/DatePicker';
import TimePicker from './pickers/TimePicker';

interface VisitBookingWizardProps {
  propertyId: string;
  media?: PropertyMediaDTO[];
  onPlaced?: (reference: string) => void;
}

export default function VisitBookingWizard({ propertyId, media, onPlaced }: VisitBookingWizardProps): JSX.Element {
  const { t } = useLanguage();
  const { isAuthenticated, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [sessions, setSessions] = useState<VisitSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [anyTime, setAnyTime] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [people, setPeople] = useState('1');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  useEffect(() => {
    visitsApi
      .getSessions(propertyId)
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [propertyId]);

  const hasActiveSessions = sessions.some((s) => !s.isFull);
  const useAnyTime = anyTime || !hasActiveSessions;

  const canContinueStep1 = useAnyTime ? Boolean(preferredDate && startTime) : Boolean(selectedSession);

  useEffect(() => {
    if (error && step === 1 && canContinueStep1) setError(null);
  }, [error, step, canContinueStep1]);

  const nextStep = () => {
    setError(null);
    if (!canContinueStep1) {
      if (useAnyTime) {
        if (!preferredDate) {
          setError(t('visit.selectDate'));
          return;
        }
        if (!startTime) {
          setError(t('visit.selectTime'));
          return;
        }
      } else {
        setError(t('visit.selectSession'));
        return;
      }
    }
    setStep(2);
  };

  const confirm = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      const booking =
        selectedSession && !useAnyTime
          ? await visitsApi.book(selectedSession, Number(people) || 1)
          : await visitsApi.bookAnyTime(propertyId, {
              preferredDate,
              startTime,
              numberOfPeople: Number(people) || 1,
            });
      setDone({ reference: booking.bookingReference });
      onPlaced?.(booking.bookingReference);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [selectedSession, useAnyTime, propertyId, preferredDate, startTime, people, onPlaced]);

  if (status === 'loading') {
    return (
      <div className="animate-pulse space-y-3 p-6">
        <div className="h-16 rounded-xl bg-gray-100" />
        <div className="h-16 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="max-w-xs text-sm text-gray-600">{t('visit.loginToBook')}</p>
        <button
          type="button"
          onClick={() => navigate('/login', { state: { from: location.pathname + location.search } })}
          className="btn-primary"
        >
          {t('nav.login')}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <section className="p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-verified" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-bold text-gray-900">{t('visit.booked')}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('visit.bookedSuccess')} · <span className="font-mono font-semibold text-gray-800">{done.reference}</span>
        </p>
        <p className="mt-2 text-xs text-gray-400">{t('visit.manageInDashboard')}</p>
      </section>
    );
  }

  const steps = [t('visit.stepWhen'), t('visit.stepConfirm')];
  const backgroundImage = media?.[0]?.thumbUrl ?? media?.[0]?.url;

  return (
    <section className="p-6" aria-label={t('visit.bookVisit')}>
      {/* Stepper */}
      <ol className="flex items-center gap-2" aria-label={t('visit.bookVisit')}>
        {steps.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const complete = step > n;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  complete ? 'bg-verified text-white' : active ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
                aria-hidden="true"
              >
                {complete ? '✓' : n}
              </span>
              <span className={`hidden text-xs font-medium sm:block ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
              {n < steps.length ? <span className="h-px flex-1 bg-gray-200" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>

      {loading ? (
        <div className="mt-5 animate-pulse space-y-3">
          <div className="h-16 rounded-xl bg-gray-100" />
          <div className="h-16 rounded-xl bg-gray-100" />
        </div>
      ) : step === 1 ? (
        <div className="mt-5">
          {hasActiveSessions && !useAnyTime ? (
            <ul className="space-y-3">
              {sessions
                .filter((s) => !s.isFull)
                .map((session) => (
                  <li key={session._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedSession(session._id)}
                      className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                        selectedSession === session._id ? 'border-brand-500 bg-brand-500/[0.04]' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <CalendarDays className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        {formatDate(session.date)} · {session.startTime}
                      </span>
                      <span className="text-xs text-gray-500">
                        {session.capacityRemaining} {t('visit.placesRemaining')}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}

          {hasActiveSessions ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setAnyTime(!anyTime)}
                className={`flex w-full items-center justify-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  anyTime ? 'border-brand-500 bg-brand-500/[0.04] text-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                {anyTime ? t('visit.useScheduled') : t('visit.anyTime')}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">{t('visit.noSessions')}</p>
          )}

          {useAnyTime ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">{t('visit.date')}</label>
                <DatePicker value={preferredDate} onChange={setPreferredDate} />
              </div>
              <div>
                <label className="label">{t('visit.time')}</label>
                <TimePicker value={startTime} onChange={setStartTime} date={preferredDate || undefined} />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5">
          {/* Confirm card with the property photo in the background */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900">
            {backgroundImage ? (
              <img src={backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <div
              className="relative flex min-h-[240px] flex-col justify-end bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/10 p-5"
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{t('visit.date')}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">
                    {useAnyTime || !selectedSession
                      ? preferredDate
                      : formatDate(sessions.find((s) => s._id === selectedSession)?.date ?? '')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{t('visit.time')}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">
                    {useAnyTime || !selectedSession
                      ? startTime
                      : sessions.find((s) => s._id === selectedSession)?.startTime}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{t('visit.people')}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-white">{people}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{t('visit.visitor')}</dt>
                  <dd className="mt-0.5 max-w-[140px] truncate text-sm font-semibold text-white">
                    {user ? `${user.firstName} ${user.lastName}` : ''}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <label htmlFor="w-people" className="mb-1.5 block text-xs font-medium text-white/80">
                  {t('visit.people')}
                </label>
                <input
                  id="w-people"
                  type="number"
                  min={1}
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-transparent bg-surface/15 px-3.5 text-sm text-white outline-none transition-all placeholder:text-white/50 focus:bg-surface/20 focus:ring-4 focus:ring-white/20"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-4 rounded-xl p-3 text-sm bg-notVerified/10 text-notVerified">{error}</p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => setStep(1)} className="btn-outline" disabled={submitting}>
            {t('visit.back')}
          </button>
        ) : null}

        {step < 2 ? (
          <button type="button" onClick={nextStep} className="btn-primary flex-1" disabled={loading}>
            {t('visit.continue')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? t('common.loading') : t('visit.confirmBooking')}
          </button>
        )}
      </div>
    </section>
  );
}