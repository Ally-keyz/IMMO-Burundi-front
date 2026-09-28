import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '@immo/shared-types';
import { DEFAULT_LANGUAGE, translate } from '../i18n/translations';
import { usersApi, getApiErrorMessage } from '../lib/api';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'immo_language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function storedLanguage(): Language {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === 'fr' || raw === 'en' || raw === 'sw' ? raw : DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [language, setLanguageState] = useState<Language>(storedLanguage);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      updateUser({ preferredLanguage: lang });
      if (isAuthenticated && user?._id) {
        usersApi.update(user._id, { preferredLanguage: lang }).catch(() => {
          /* non-critical: local state stays correct */
        });
      }
    },
    [isAuthenticated, user?._id, updateUser],
  );

  useEffect(() => {
    if (user?.preferredLanguage && user.preferredLanguage !== language) {
      setLanguageState(user.preferredLanguage);
      localStorage.setItem(STORAGE_KEY, user.preferredLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferredLanguage]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => translate(language, key, params),
    [language],
  );

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

export { getApiErrorMessage };