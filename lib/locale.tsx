'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en, type Copy } from '@/content/copy/en';
import { hi } from '@/content/copy/hi';
import type { Locale } from '@/lib/whatsapp';

const DICTIONARIES: Record<Locale, Copy> = { en, hi };
const STORAGE_KEY = 'shakti.locale';

/**
 * Which language the statically exported HTML is rendered in. Defaults to
 * English; set NEXT_PUBLIC_DEFAULT_LOCALE=hi at build time for a Hindi-first
 * export. A visitor's stored preference still wins as soon as the page hydrates.
 */
const DEFAULT_LOCALE: Locale =
  process.env.NEXT_PUBLIC_DEFAULT_LOCALE === 'hi' ? 'hi' : 'en';

type LocaleContextValue = {
  locale: Locale;
  copy: Copy;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  copy: en,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Always start at the build's default locale so the statically exported HTML
  // and the first client render agree. The stored preference is applied
  // immediately after mount, and then survives client-side navigation because
  // this provider never unmounts.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode / storage disabled — English is a fine fallback.
    }
    if (stored === 'hi' || stored === 'en') setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = DICTIONARIES[locale].meta.htmlLang;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* no-op */
    }
  }, []);

  const value = useMemo(
    () => ({ locale, copy: DICTIONARIES[locale], setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

/** Pick the right side of a `{ en, hi }` pair from content data. */
export function useLocalised() {
  const { locale } = useLocale();
  return useCallback((pair: { en: string; hi: string }) => pair[locale], [locale]);
}
