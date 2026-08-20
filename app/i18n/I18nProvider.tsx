"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { languages, messages } from "./messages";
import type { Locale, MessageKey } from "./messages";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (
    key: MessageKey,
    values?: Record<string, string | number>,
  ) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const availableLocales = new Set<string>(languages.map(({ code }) => code));

function detectBrowserLocale(): Locale | null {
  if (typeof navigator === "undefined") return null;
  const rawLocales: string[] =
    navigator.languages && navigator.languages.length
      ? Array.from(navigator.languages)
      : [navigator.language];
  for (const raw of rawLocales) {
    if (!raw) continue;
    const base = raw.split("-")[0].toLowerCase();
    if (availableLocales.has(base)) return base as Locale;
  }
  return null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>("en");

  const setLocale = useCallback((nextLocale: Locale) => {
    updateLocale(nextLocale);
    window.localStorage.setItem("sv-lang", nextLocale);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedLocale = window.localStorage.getItem("sv-lang");
      if (storedLocale && availableLocales.has(storedLocale)) {
        updateLocale(storedLocale as Locale);
        return;
      }
      const detected = detectBrowserLocale();
      if (detected) updateLocale(detected);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const language = languages.find(({ code }) => code === locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = language && "rtl" in language && language.rtl
      ? "rtl"
      : "ltr";
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, values?: Record<string, string | number>) => {
      const localeMessages = messages[locale] as Partial<Record<MessageKey, string>>;
      const template = localeMessages[key] ?? messages.en[key] ?? messages.fr[key];
      if (!values) return template;
      return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) =>
        Object.prototype.hasOwnProperty.call(values, name)
          ? String(values[name])
          : match,
      );
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n doit être utilisé sous I18nProvider.");
  return value;
}
