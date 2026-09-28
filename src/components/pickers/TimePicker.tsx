import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePopover } from './usePopover';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  /** YYYY-MM-DD — disables slots that have already passed for today. */
  date?: string;
}

const LOCALES: Record<string, string> = { en: 'en-US', fr: 'fr-FR', sw: 'sw' };
const DAY_START_MIN = 7 * 60;
const DAY_END_MIN = 20 * 60;
const STEP_MIN = 30;

interface TimeSlot {
  time: string;
  label: string;
  minutes: number;
}

const GROUPS = [
  { key: 'picker.morning', from: 7 * 60, to: 11 * 60 + 30 },
  { key: 'picker.afternoon', from: 12 * 60, to: 17 * 60 + 30 },
  { key: 'picker.evening', from: 18 * 60, to: 20 * 60 },
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export default function TimePicker({ value, onChange, date }: TimePickerProps): JSX.Element {
  const { t, language } = useLanguage();
  const { ref, open, toggle, setOpen } = usePopover();
  const locale = LOCALES[language] ?? 'en-US';

  const slots = useMemo<TimeSlot[]>(() => {
    const fmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
    const list: TimeSlot[] = [];
    for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += STEP_MIN) {
      const hour = Math.floor(m / 60);
      const minute = m % 60;
      list.push({ time: `${pad2(hour)}:${pad2(minute)}`, label: fmt.format(new Date(2000, 0, 1, hour, minute)), minutes: m });
    }
    return list;
  }, [locale]);

  const groups = useMemo(
    () => GROUPS.map((g) => ({ ...g, items: slots.filter((s) => s.minutes >= g.from && s.minutes <= g.to) })),
    [slots],
  );

  const todayISO = new Date();
  const isToday = date === `${todayISO.getFullYear()}-${pad2(todayISO.getMonth() + 1)}-${pad2(todayISO.getDate())}`;
  const nowMinutes = todayISO.getHours() * 60 + todayISO.getMinutes();

  const pickTime = (slot: TimeSlot) => {
    onChange(slot.time);
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
          <Clock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
          {value
            ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(
                new Date(2000, 0, 1, Number(value.slice(0, 2)), Number(value.slice(3, 5))),
              )
            : t('picker.selectTime')}
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
            aria-label={t('visit.time')}
            className="absolute top-full right-0 z-30 mt-2 w-[288px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gray-200 bg-surface p-3 shadow-pop"
          >
            <div className="max-h-64 overflow-y-auto pr-0.5">
              {groups.map((group) => (
                <div key={group.key} className="mb-3 last:mb-0">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{t(group.key)}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {group.items.map((slot) => {
                      const disabled = isToday && slot.minutes < nowMinutes;
                      const isSelected = slot.time === value;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={disabled}
                          onClick={() => pickTime(slot)}
                          aria-pressed={isSelected}
                          className={`h-9 rounded-lg text-sm transition-colors ${
                            isSelected
                              ? 'border border-brand-600 bg-brand-600 font-semibold text-white'
                              : 'border border-transparent bg-gray-100 text-gray-700 hover:border-gray-300 hover:bg-surface'
                          } ${disabled ? 'cursor-not-allowed text-gray-300 hover:border-transparent hover:bg-gray-100' : ''}`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}