"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export type CopyFields = {
  h1?: string | null;
  subtitle?: string | null;
  ctaPrimary?: string | null;
  ctaSecondary?: string | null;
};

type CopyOverrideDoc = {
  ro?: CopyFields;
  en?: CopyFields;
};

const copyCache = new Map<string, CopyOverrideDoc | null>();
const inflight = new Map<string, Promise<CopyOverrideDoc | null>>();

export function useCopy(screenId: string | null | undefined, locale: "ro" | "en", fallback?: CopyFields) {
  const [docData, setDocData] = useState<CopyOverrideDoc | null>(() => {
    if (!screenId) return null;
    return copyCache.get(screenId) ?? null;
  });

  useEffect(() => {
    if (!screenId) {
      setDocData(null);
      return;
    }
    const cached = copyCache.get(screenId);
    let cancelled = false;
    if (cached !== undefined) {
      setDocData(cached);
      return;
    }
    let pending = inflight.get(screenId);
    if (!pending) {
      const ref = doc(getDb(), "copyOverrides", screenId);
      pending = getDoc(ref)
        .then((snapshot) => {
          const data = snapshot.exists() ? (snapshot.data() as CopyOverrideDoc) : null;
          copyCache.set(screenId, data);
          return data;
        })
        .catch(() => {
          copyCache.set(screenId, null);
          return null;
        })
        .finally(() => {
          inflight.delete(screenId);
        });
      inflight.set(screenId, pending);
    }
    pending.then((data) => {
      if (!cancelled) {
        setDocData(data ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [screenId]);

  const localized = docData?.[locale] ?? null;

  return {
    h1: localized?.h1 ?? fallback?.h1 ?? null,
    subtitle: localized?.subtitle ?? fallback?.subtitle ?? null,
    ctaPrimary: localized?.ctaPrimary ?? fallback?.ctaPrimary ?? null,
    ctaSecondary: localized?.ctaSecondary ?? fallback?.ctaSecondary ?? null,
  };
}
