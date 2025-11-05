// components/I18nProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import en from "../i18n/en.json";
import ro from "../i18n/ro.json";

type Lang = "en" | "ro";
type Translations = Record<string, string>;

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [translations, setTranslations] = useState<Translations>(en);

  useEffect(() => {
    if (lang === "ro") setTranslations(ro);
    else setTranslations(en);
  }, [lang]);

  const t = (key: string) => translations[key] || key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
