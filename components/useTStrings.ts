"use client";

import { useI18n } from "./I18nProvider";

export function useTStrings() {
  const { t } = useI18n();
  const s = (key: string, fallback = ""): string => {
    const v = t(key);
    if (typeof v === "string") {
      // If provider returns the key itself (fallback), prefer our fallback param
      return v === key ? fallback : (v as string);
    }
    return fallback;
  };
  const sa = (key: string): string[] => {
    const v = t(key);
    return Array.isArray(v) ? (v as string[]) : [];
  };
  const so = <T = Record<string, unknown>>(key: string, fallback?: T): T | undefined => {
    const v = t(key);
    return (v && typeof v === "object") ? (v as T) : fallback;
  };
  return { s, sa, so };
}
