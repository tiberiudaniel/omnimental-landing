"use client";

import { useEffect, useMemo, useState } from "react";
import type { InsightItem, InsightTheme } from "@/lib/insights";
import { getDailyInsight } from "@/lib/insights";
import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

// Cloud schema (read-only):
// Collection: insights
//   Doc id: theme (e.g., "Calm", "Clarity", "Energy", "Focus")
//     Field: items: string[]

type InsightSource = "local" | "cloud";

const memoryCache: Partial<Record<InsightTheme, { day: number; item: InsightItem }>> = {};

export function useInsightOfTheDay(
  theme: InsightTheme,
): { item: InsightItem; source: InsightSource } {
  const localInsight = useMemo(() => getDailyInsight(theme), [theme]);
  const [cloudInsight, setCloudInsight] = useState<InsightItem | null>(null);

  const useCloud =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_CLOUD_INSIGHTS === "1";

  useEffect(() => {
    if (!useCloud) return;

    let canceled = false;
    let timeoutId: number | undefined;
    (async () => {
      const today = new Date().getDate();
      // serve from memory cache if available for today
      const cached = memoryCache[theme];
      if (cached && cached.day === today) {
        if (!canceled) {
          timeoutId = window.setTimeout(() => setCloudInsight(cached.item), 0);
        }
        return;
      }
      try {
        const db = getDb();
        const ref = doc(db, "insights", theme);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data() as { items?: unknown };
        const arr = Array.isArray(data.items) ? (data.items as unknown[]).filter((x) => typeof x === "string") as string[] : [];
        if (!arr.length) return;
        const dayIndex = new Date().getDate();
        const text = arr[dayIndex % arr.length];
        const item = { theme, text } as InsightItem;
        memoryCache[theme] = { day: today, item };
        if (!canceled) {
          timeoutId = window.setTimeout(() => setCloudInsight(item), 0);
        }
      } catch {
        // silent fallback to local
      }
    })();

    return () => {
      canceled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [theme, useCloud]);

  return useCloud && cloudInsight
    ? { item: cloudInsight, source: "cloud" }
    : { item: localInsight, source: "local" };
}
