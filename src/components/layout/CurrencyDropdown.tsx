import { useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { CurrencyCode } from '@immo/shared-types';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePopover } from '../pickers/usePopover';
import Popover from '../Popover';

const CURRENCY_INFO: Record<CurrencyCode, { label: string }> = {
  BIF: { label: 'Burundian Franc' },
  USD: { label: 'US Dollar' },
};

export default function CurrencyDropdown(): JSX.Element {
  const { t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const panelRef = useRef<HTMLDivElement>(null);
  const { ref, open, toggle } = usePopover(panelRef);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={t('common.currency')}
        title={CURRENCY_INFO[currency].label}
        className="flex h-7 items-center gap-1.5 rounded-full px-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <span className="flex h-[18px] min-w-[28px] items-center justify-center rounded-[3px] bg-gray-100 px-1 text-[11px] font-bold text-gray-700">
          {currency}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <Popover
        open={open}
        anchor={ref}
        panelRef={panelRef}
        className="w-44 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-pop"
      >
        {(Object.keys(CURRENCY_INFO) as CurrencyCode[]).map((code) => {
          const active = code === currency;
          return (
            <button
              key={code}
              type="button"
              onClick={() => {
                setCurrency(code);
                toggle();
              }}
              aria-pressed={active}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                active ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex h-[16px] min-w-[26px] items-center justify-center rounded-[3px] bg-gray-100 px-1 text-[11px] font-bold text-gray-700">
                {code}
              </span>
              <span className="flex-1">{CURRENCY_INFO[code].label}</span>
              {active ? <Check className="h-4 w-4 text-brand-600" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </Popover>
    </div>
  );
}