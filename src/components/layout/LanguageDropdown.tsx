import { Check, ChevronDown, Globe } from 'lucide-react';
import type { Language } from '@immo/shared-types';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePopover } from '../pickers/usePopover';

const FLAG_SRC: Record<Language, { src: string; alt: string; label: string }> = {
  fr: { src: 'https://flagcdn.com/w40/fr.png', alt: 'France', label: 'Français' },
  en: { src: 'https://flagcdn.com/w40/us.png', alt: 'United States', label: 'English' },
  sw: { src: 'https://flagcdn.com/w40/tz.png', alt: 'Tanzania', label: 'Kiswahili' },
};

export default function LanguageDropdown(): JSX.Element {
  const { t, language, setLanguage } = useLanguage();
  const { ref, open, toggle } = usePopover();

  const current = FLAG_SRC[language];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={t('common.language')}
        title={current.label}
        className="flex h-7 items-center gap-1.5 rounded-full px-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <img src={current.src} alt={current.alt} className="h-[18px] w-[26px] rounded-[3px] object-cover shadow-sm" />
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-pop">
          {(Object.keys(FLAG_SRC) as Language[]).map((lang) => {
            const opt = FLAG_SRC[lang];
            const active = lang === language;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setLanguage(lang);
                  toggle();
                }}
                aria-pressed={active}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  active ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <img src={opt.src} alt={opt.alt} className="h-[16px] w-[24px] rounded-[3px] object-cover shadow-sm" />
                <span className="flex-1">{opt.label}</span>
                {active ? <Check className="h-4 w-4 text-brand-600" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}