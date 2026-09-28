import { Smartphone } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { MOBILE_MONEY_CATALOG, type MobileMoneyProvider } from '../../lib/mobileMoney';

interface PaymentProvidersPanelProps {
  selected: MobileMoneyProvider | null;
  onSelect: (provider: MobileMoneyProvider) => void;
  disabled?: boolean;
}

/**
 * Right-hand side of the payment page. Mirrors the auth photo panel slot, so
 * the customer sees the available Burundian mobile money services while the
 * amount and MSISDN form stays on the left.
 */
export default function PaymentProvidersPanel({
  selected,
  onSelect,
  disabled = false,
}: PaymentProvidersPanelProps): JSX.Element {
  const { t } = useLanguage();

  return (
    <div className="relative hidden w-1/2 shrink-0 overflow-hidden bg-ink md:flex md:flex-col">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(120% 80% at 85% 5%, #1F3A34 0%, #14211E 45%, #0C1512 100%)',
        }}
      />
      <div className="relative flex h-full flex-col justify-between p-6 xl:p-7">
        <div>
          <h2 className="max-w-sm text-xl font-bold leading-snug text-white xl:text-2xl">
            {t('pay.panelTitle')}
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/60">{t('pay.panelDesc')}</p>
        </div>

        <ul className="space-y-2">
          {MOBILE_MONEY_CATALOG.map((provider) => {
            const isSelected = selected === provider.id;
            return (
              <li key={provider.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(provider.id)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSelected
                      ? 'border-white/80 bg-white/10 shadow-lg'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.08]'
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold"
                    style={{ backgroundColor: provider.color, color: provider.onColor }}
                    aria-hidden="true"
                  >
                    {provider.monogram}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {isSelected ? t(`pay.provider.${provider.id}`) : provider.name}
                    </span>
                    <span className="block truncate text-xs text-white/55">{provider.operator}</span>
                  </span>
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{ backgroundColor: provider.softColor, color: provider.color }}
                  >
                    {provider.ussd}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-white/45">
          <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('pay.panelFootnote')}
        </p>
      </div>
    </div>
  );
}
