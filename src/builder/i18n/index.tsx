import { createContext, useContext, type ReactNode } from 'react';
import { en, type Strings } from './en';
import { he } from './he';

export type { Strings };

/** Languages the builder ships with. */
export type Lang = 'en' | 'he';

const DICTS: Record<Lang, Strings> = { en, he };

/** Languages rendered right-to-left; drives the `dir` attribute on the root. */
const RTL_LANGS: Lang[] = ['he'];

export function isRtl(lang: Lang): boolean {
  return RTL_LANGS.includes(lang);
}

const LangContext = createContext<{ lang: Lang; t: Strings }>({ lang: 'en', t: en });

export function LangProvider({ lang = 'en', children }: { lang?: Lang; children: ReactNode }) {
  // Fall back to English if a host passes an unknown code at runtime.
  const t = DICTS[lang] ?? en;
  return <LangContext.Provider value={{ lang, t }}>{children}</LangContext.Provider>;
}

/** The active language's strings. */
export function useT(): Strings {
  return useContext(LangContext).t;
}

/** The active language code. */
export function useLang(): Lang {
  return useContext(LangContext).lang;
}
