import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EN_US, ZH_CN, type MessageKey } from "./messages";

export type { MessageKey } from "./messages";
export { EN_US, ZH_CN, getComponentCatalogSearchHaystack } from "./messages";

export type AppLocale = "zh-CN" | "en-US";

const STORAGE_KEY = "xallor_locale";

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): AppLocale {
  const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
  return stored === "en-US" ? "en-US" : "zh-CN";
}

export function AppI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(() => getInitialLocale());

  useEffect(() => {
    globalThis.localStorage?.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const dict = locale === "en-US" ? EN_US : ZH_CN;
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => dict[key],
    }),
    [locale, dict],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useAppI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useAppI18n must be used within AppI18nProvider");
  }
  return ctx;
}
