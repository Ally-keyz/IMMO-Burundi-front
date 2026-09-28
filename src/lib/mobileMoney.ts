import { MOBILE_MONEY_PROVIDERS, type MobileMoneyProvider } from '@immo/shared-types';

export { MOBILE_MONEY_PROVIDERS };
export type { MobileMoneyProvider };

export interface MobileMoneyProviderMeta {
  id: MobileMoneyProvider;
  /** Service name shown to the customer. */
  name: string;
  /** Mobile money brand as printed on the USSD/app. */
  wallet: string;
  operator: string;
  /** Primary brand colour used for the tile and selection ring. */
  color: string;
  /** Tinted background for the tile. */
  softColor: string;
  /** Text colour that stays readable on `color`. */
  onColor: string;
  monogram: string;
  /** USSD code the customer can fall back to. */
  ussd: string;
}

export const MOBILE_MONEY_CATALOG: readonly MobileMoneyProviderMeta[] = [
  {
    id: 'LUMICASH',
    name: 'Lumicash',
    wallet: 'Lumicash',
    operator: 'Lumitel (Viettel)',
    color: '#EE0033',
    softColor: '#FDECEF',
    onColor: '#FFFFFF',
    monogram: 'LC',
    ussd: '*226#',
  },
  {
    id: 'ECOCASH',
    name: 'EcoCash',
    wallet: 'EcoCash',
    operator: 'Econet Leo',
    color: '#FFCC00',
    softColor: '#FFF8E1',
    onColor: '#1A1A1A',
    monogram: 'EC',
    ussd: '*722#',
  },
  {
    id: 'IHELA',
    name: 'iHela',
    wallet: 'iHela Ryanje',
    operator: 'iHela Credit Union',
    color: '#0F766E',
    softColor: '#E6F4F1',
    onColor: '#FFFFFF',
    monogram: 'iH',
    ussd: '*434#',
  },
];

export function providerMeta(id: MobileMoneyProvider | string | undefined | null): MobileMoneyProviderMeta | null {
  if (!id) return null;
  const value = String(id).toUpperCase();
  return MOBILE_MONEY_CATALOG.find((p) => p.id === value) ?? null;
}

/** Formats a raw MSISDN into readable Burundian groups: 79 11 10 01. */
export function formatMsisdn(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
}

/**
 * Client-side pre-check mirroring the API's `normalizeMsisdn`: strips +257 /
 * leading zeros and requires a valid Burundian mobile prefix (2, 6 or 7).
 */
export function isValidBurundiMsisdn(raw: string): boolean {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('257')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return /^[267]\d{7}$/.test(digits);
}
