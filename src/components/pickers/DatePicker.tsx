import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePopover } from './usePopover';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
}

const LOCALES: Record<string, string> = { en: 'en-US', fr: 'fr-FR', sw: 'sw' };

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayStart(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export default function DatePicker({ value, onChange, min }: DatePickerProps): JSX.Element {
  const { t, language } = useLanguage();
  const { ref, open, toggle, setOpen } = usePopover();
  const locale = LOCALES[language] ?? 'en-US';

  const today = new Date();
  const minTime = min ? dayStart(new Date(`${min}T00:00:00`)) : dayStart(today);
  const selected = value ? new Date(`${value}T00:00:00`) : null;

  const [view, setView] = useState<Date>(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(view);

  const weekdays = useMemo(() => {
    const base = new Date(2021, 11, 6);
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)));
  }, [locale]);

  const cells = useMemo(() => {
    const y = view.getFullYear();
    const m = view.getMonth();
    const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const items: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let d = 1; d <= daysInMonth; d += 1) items.push(d);
    return items;
  }, [view]);

  const moveMonth = (delta: number) => {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  };

  const selectDate = (date: Date) => {
    onChange(toISO(date));
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-[10px] border border-transparent bg-field px-3.5 text-sm outline-none transition-all focus:border-transparent focus:bg-surface focus:ring-4 focus:ring-brand-500/15 ${
          value ? 'text-gray-900' : 'text-gray-400'
        }`}
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          {value
            ? new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: 'short' }).format(selected!)
            : t('picker.selectDate')}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="dialog"
            aria-label={t('visit.date')}
            className="absolute top-full left-0 z-30 mt-2 w-[288px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gray-200 bg-surface p-3 shadow-pop"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekdays.map((w, i) => (
                <span key={i} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {w}
                </span>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <span key={`empty-${i}`} aria-hidden="true" />;
                const d = new Date(view.getFullYear(), view.getMonth(), day);
                const iso = toISO(d);
                const disabled = d.getTime() < minTime;
                const isSelected = iso === value;
                const isToday = iso === toISO(today);
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDate(d)}
                    aria-pressed={isSelected}
                    className={`h-8 w-full rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-brand-600 font-semibold text-white'
                        : isToday
                          ? 'bg-brand-50 font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100'
                          : 'text-gray-800 hover:bg-gray-100'
                    } ${disabled ? 'cursor-not-allowed text-gray-300 hover:bg-transparent' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => selectDate(today)}
                className="h-8 flex-1 rounded-full border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:border-brand-500 hover:text-brand-600"
              >
                {t('picker.today')}
              </button>
              <button
                type="button"
                onClick={() => selectDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))}
                className="h-8 flex-1 rounded-full border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:border-brand-500 hover:text-brand-600"
              >
                {t('picker.tomorrow')}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}