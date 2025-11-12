// components/I18nProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import en from "../i18n/en.json";
import ro from "../i18n/ro.json";

type Lang = "en" | "ro";
type TranslationValue = unknown;
type Translations = Record<string, TranslationValue>;

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => TranslationValue;
};

const I18nContext = createContext<I18nContextType>({
  lang: "ro",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ro");
  const translations = useMemo<Translations>(() => (lang === "ro" ? ro : en), [lang]);
  const t = (key: string) => {
    // Support dot-path lookup (e.g., "antrenamentTabHelp.os")
    try {
      if (!key || typeof key !== "string") return key;
      const segments = key.split(".");
      let cur: unknown = translations;
      for (const seg of segments) {
        if (cur && typeof cur === "object" && seg in (cur as Record<string, unknown>)) {
          cur = (cur as Record<string, unknown>)[seg];
        } else {
          return key;
        }
      }
      return cur ?? key;
    } catch {
      return key;
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
