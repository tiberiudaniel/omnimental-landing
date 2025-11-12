"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "./I18nProvider";

/**
 * Reads `?lang=ro|en` from the URL and applies it to i18n without resetting any progress.
 * Runs softly on client only.
 */
export default function QueryLangSync() {
  const params = useSearchParams();
  const { lang, setLang } = useI18n();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const q = params?.get("lang");
    if (!q) return;
    const value = q.toLowerCase();
    if (value !== "ro" && value !== "en") return;
    if (appliedRef.current === value) return;
    if (lang !== value) setLang(value as "ro" | "en");
    appliedRef.current = value;
  }, [lang, params, setLang]);

  return null;
}

