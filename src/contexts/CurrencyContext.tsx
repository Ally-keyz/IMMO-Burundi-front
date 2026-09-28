import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CurrencyCode } from '@immo/shared-types';
import { geoApi } from '../lib/api';
import { formatNumber } from '../lib/format';
import { usersApi } from '../lib/api';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'immo_currency';

/** Fallback mid-market rate for BIF↔USD when the rate endpoint is unavailable. */
const DEFAULT_RATES: Record<string, number> = {
  'BIF:USD': 1 / 2850,
  'USD:BIF': 2850,
  'BIF:BIF': 1,
  'USD:USD': 1,
};

interface ConvertedPrice {
  amount: number;
  currency: CurrencyCode;
  rate: number;
  rateDate?: string;
  isEstimate: boolean;
}

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Record<string, number>;
  isLoadingRates: boolean;
  /** Convert value from one currency to the display currency; null when no rate. */
  convertCurrency: (amount: number, from: CurrencyCode, to?: CurrencyCode) => ConvertedPrice | null;
  /** Format a price in the user's preferred currency. Original amount never overwritten. */
  formatPrice: (amount: number, originalCurrency: CurrencyCode) => string;
  /** Format a price fully: original + (estimated) converted when different. */
  formatPriceWithOriginal: (amount: number, originalCurrency: CurrencyCode) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

function storedCurrency(): CurrencyCode {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === 'USD' || raw === 'BIF' ? raw : 'BIF';
}

export function CurrencyProvider({ children }: { children: ReactNode }): JSX.Element {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [currency, setCurrencyState] = useState<CurrencyCode>(storedCurrency);
  const [rates, setRates] = useState<Record<string, number>>(() => {
    try {
      const cached = localStorage.getItem('immo_exchange_rates');
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, number>;
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_RATES, ...parsed };
      }
    } catch {
      /* ignore corrupt cache */
    }
    return { ...DEFAULT_RATES };
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingRates(true);
    geoApi
      .getExchangeRates()
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        const next: Record<string, number> = { ...DEFAULT_RATES };
        for (const row of list) {
          const key = `${row.fromCurrency}:${row.toCurrency}`;
          if (row.rate > 0) next[key] = row.rate;
        }
        setRates(next);
        localStorage.setItem('immo_exchange_rates', JSON.stringify(next));
      })
      .catch(() => {
        /* endpoint not available on this backend — default fallback rates already in state */
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRates(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback(
    (c: CurrencyCode) => {
      setCurrencyState(c);
      localStorage.setItem(STORAGE_KEY, c);
      updateUser({ preferredCurrency: c });
      if (isAuthenticated && user?._id) {
        usersApi.update(user._id, { preferredCurrency: c }).catch(() => {
          /* non-critical */
        });
      }
    },
    [isAuthenticated, user?._id, updateUser],
  );

  useEffect(() => {
    if (user?.preferredCurrency && user.preferredCurrency !== currency) {
      setCurrencyState(user.preferredCurrency);
      localStorage.setItem(STORAGE_KEY, user.preferredCurrency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferredCurrency]);

  const convertCurrency = useCallback(
    (amount: number, from: CurrencyCode, to?: CurrencyCode): ConvertedPrice | null => {
      const target = to ?? currency;
      const key = `${from}:${target}`;
      const rate = rates?.[key];
      if (!Number.isFinite(rate) || rate <= 0) return null;
      return {
        amount: amount * rate,
        currency: target,
        rate,
        isEstimate: target !== from,
      };
    },
    [currency, rates],
  );

  const formatPrice = useCallback(
    (amount: number, originalCurrency: CurrencyCode): string => {
      const converted = convertCurrency(amount, originalCurrency);
      if (!converted) return `${formatNumber(amount)} ${originalCurrency}`;
      return `${formatNumber(converted.amount)} ${converted.currency}`;
    },
    [convertCurrency],
  );

  const formatPriceWithOriginal = useCallback(
    (amount: number, originalCurrency: CurrencyCode): string => {
      const converted = convertCurrency(amount, originalCurrency);
      if (!converted || converted.currency === originalCurrency) {
        return `${formatNumber(amount)} ${originalCurrency}`;
      }
      return `${formatNumber(amount)} ${originalCurrency} (≈ ${formatNumber(converted.amount)} ${converted.currency})`;
    },
    [convertCurrency],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      rates,
      isLoadingRates,
      convertCurrency,
      formatPrice,
      formatPriceWithOriginal,
    }),
    [currency, setCurrency, rates, isLoadingRates, convertCurrency, formatPrice, formatPriceWithOriginal],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}