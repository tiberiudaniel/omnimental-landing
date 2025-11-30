"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JournalDoc, JournalTabId } from "@/lib/journal";
import { getJournalByUser, updateJournalTab } from "@/lib/journal";
import { recordTextSignals } from "@/lib/textSignals";

export type JournalContext = {
  theme?: string;
  sourcePage?: string;
  sourceBlock?: string;
  suggestedSnippets?: string[];
};

type JournalState = {
  loading: boolean;
  saving: boolean;
  tabs: Record<JournalTabId, string>;
};

const EMPTY: JournalState = {
  loading: true,
  saving: false,
  tabs: {
    SCOP_INTENTIE: "",
    MOTIVATIE_REZURSE: "",
    PLAN_RECOMANDARI: "",
    OBSERVATII_EVALUARE: "",
    NOTE_LIBERE: "",
  },
};

const LOCAL_FALLBACK_PREFIX = "omnimental_journal_fallback_";
const LOCAL_RECENT_PREFIX = "omnimental_recent_entries_";

function mapFromDoc(doc?: JournalDoc | null): Record<JournalTabId, string> {
  return {
    SCOP_INTENTIE: doc?.tabs.SCOP_INTENTIE?.text ?? "",
    MOTIVATIE_REZURSE: doc?.tabs.MOTIVATIE_REZURSE?.text ?? "",
    PLAN_RECOMANDARI: doc?.tabs.PLAN_RECOMANDARI?.text ?? "",
    OBSERVATII_EVALUARE: doc?.tabs.OBSERVATII_EVALUARE?.text ?? "",
    NOTE_LIBERE: doc?.tabs.NOTE_LIBERE?.text ?? "",
  };
}

export function useJournal(userId: string | null | undefined) {
  const [state, setState] = useState<JournalState>(EMPTY);
  const lastSavedRef = useRef<Record<JournalTabId, string>>(EMPTY.tabs);
  const inFlightRef = useRef<Record<JournalTabId, boolean>>({
    SCOP_INTENTIE: false,
    MOTIVATIE_REZURSE: false,
    PLAN_RECOMANDARI: false,
    OBSERVATII_EVALUARE: false,
    NOTE_LIBERE: false,
  });
  const timersRef = useRef<Record<JournalTabId, number | null>>({
    SCOP_INTENTIE: null,
    MOTIVATIE_REZURSE: null,
    PLAN_RECOMANDARI: null,
    OBSERVATII_EVALUARE: null,
    NOTE_LIBERE: null,
  });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const doc = await getJournalByUser(userId);
        if (cancelled) return;
        const mapped = mapFromDoc(doc);
        setState({ loading: false, saving: false, tabs: mapped });
        lastSavedRef.current = mapped;
      } catch (e: unknown) {
        // Downgrade permission issues to warnings to avoid noisy console errors in demo/guest
        const code = (typeof e === 'object' && e && 'code' in e) ? String((e as { code?: unknown }).code ?? '') : '';
        const message = (typeof e === 'object' && e && 'message' in e) ? String((e as { message?: unknown }).message ?? '') : '';
        const isPermDenied = code.includes('permission') || /Missing or insufficient permissions/i.test(message);
        try {
          const q = typeof window !== 'undefined' ? window.location.search : '';
          const isDemoOrE2E = q.includes('e2e=1') || q.includes('demo=1');
          if (isDemoOrE2E || isPermDenied) {
            console.warn("journal load failed", e);
          } else {
            console.error("journal load failed", e);
          }
        } catch {
          if (isPermDenied) {
            console.warn("journal load failed", e);
          } else {
            console.error("journal load failed", e);
          }
        }
        if (!cancelled) {
          // Try to hydrate from local fallback for demo/guest
          let tabs = EMPTY.tabs;
          try {
            const key = `omnimental_journal_fallback_${userId}`;
            const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
            if (raw) {
              const parsed = JSON.parse(raw) as Partial<Record<JournalTabId, string>>;
              tabs = { ...tabs, ...parsed } as Record<JournalTabId, string>;
            }
          } catch {}
          setState((s) => ({ ...s, loading: false, tabs }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setTabText = useCallback((tabId: JournalTabId, text: string) => {
    setState((s) => ({ ...s, tabs: { ...s.tabs, [tabId]: text } }));
  }, []);

  const saveTab = useCallback(
    async (tabId: JournalTabId, context?: JournalContext): Promise<"cloud" | "local" | "noop" | "error"> => {
      if (!userId) return "noop";
      const text = state.tabs[tabId] ?? "";
      if ((text ?? "").trim() === (lastSavedRef.current[tabId] ?? "").trim()) {
        return "noop";
      }
      if (inFlightRef.current[tabId]) {
        return "noop";
      }
      setState((s) => ({ ...s, saving: true }));
      inFlightRef.current[tabId] = true;
      // In demo/e2e mode, avoid Firestore writes entirely; persist to local fallback only
      try {
        const q = typeof window !== 'undefined' ? window.location.search : '';
        const isDemoOrE2E = q.includes('e2e=1') || q.includes('demo=1');
        if (isDemoOrE2E) {
          console.log("[Journal] demo/e2e: skip Firestore write", { userId, path: `userJournals/${userId}` });
          try {
            persistLocalJournalTab(userId, tabId, text);
            persistLocalRecentEntry(userId, tabId, text);
          } catch {}
          lastSavedRef.current[tabId] = text;
          setState((s) => ({ ...s, saving: false }));
          inFlightRef.current[tabId] = false;
          return "local";
        }
      } catch {}
      try {
        console.log("[Journal] trying to write to Firestore", { userId, path: `userJournals/${userId}` });
        // Optimistically mark as saved to avoid duplicate concurrent writes
        lastSavedRef.current[tabId] = text;
        await updateJournalTab(userId, tabId, {
          text,
          theme: context?.theme ?? null,
          sourcePage: context?.sourcePage ?? null,
          sourceBlock: context?.sourceBlock ?? null,
        });
        console.log("[Journal] Firestore write OK");
        // Remember last edited tab cross-context for better UX
        try {
          if ((text ?? '').trim()) {
            window.localStorage.setItem('journalLastEditedTab', tabId);
          }
        } catch {}
        // Fire-and-forget text analytics (best-effort)
        void recordTextSignals({ text, source: `journal:${tabId}`, context: context as Record<string, unknown> | undefined });
        // Add a lightweight practice session so trends reflect journal activity
        try {
          const started = Date.now() - 120000;
          const isPlan = tabId === 'PLAN_RECOMANDARI';
          const dur = isPlan ? 240 : 120; // plan entries contează mai mult
          const { recordPracticeSession } = await import("@/lib/progressFacts");
          void recordPracticeSession("reflection", started, dur, userId ?? null);
        } catch {}
        return "cloud";
      } catch (e: unknown) {
        const code = (typeof e === 'object' && e && 'code' in e) ? String((e as { code?: unknown }).code ?? '') : '';
        const message = (typeof e === 'object' && e && 'message' in e) ? String((e as { message?: unknown }).message ?? '') : '';
        const isPermDenied = code.includes('permission') || /Missing or insufficient permissions/i.test(message);
        // Also treat demo/e2e as non-fatal
        let isDemoOrE2E = false;
        try {
          const q = typeof window !== 'undefined' ? window.location.search : '';
          isDemoOrE2E = q.includes('e2e=1') || q.includes('demo=1');
        } catch {}
        if (isPermDenied || isDemoOrE2E) {
          console.warn("journal save failed", e);
          // Best-effort local fallback so user doesn't lose text in demo/guest
          try {
            persistLocalJournalTab(userId, tabId, text);
            persistLocalRecentEntry(userId, tabId, text);
          } catch {}
          return "local";
        } else {
          console.error("journal save failed", e);
          return "error";
        }
      } finally {
        setState((s) => ({ ...s, saving: false }));
        inFlightRef.current[tabId] = false;
      }
    },
    [userId, state.tabs],
  );

  const scheduleSave = useCallback(
    (tabId: JournalTabId, context?: JournalContext) => {
      const t = timersRef.current[tabId];
      if (t) {
        try {
          window.clearTimeout(t);
        } catch {}
      }
      timersRef.current[tabId] = window.setTimeout(() => {
        void saveTab(tabId, context);
      }, 700) as unknown as number;
    },
    [saveTab],
  );

  return { ...state, setTabText, saveTab, scheduleSave };
}

function persistLocalJournalTab(userId: string, tabId: JournalTabId, text: string) {
  if (typeof window === "undefined") return;
  try {
    const key = `${LOCAL_FALLBACK_PREFIX}${userId}`;
    const existingRaw = window.localStorage.getItem(key);
    const existing = existingRaw ? (JSON.parse(existingRaw) as Record<string, string>) : {};
    existing[tabId] = text;
    window.localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // noop
  }
}

function persistLocalRecentEntry(userId: string, tabId: JournalTabId, text: string) {
  if (typeof window === "undefined") return;
  const normalized = (text ?? "").trim();
  if (!normalized) return;
  try {
    const key = `${LOCAL_RECENT_PREFIX}${userId}`;
    const existingRaw = window.localStorage.getItem(key);
    const existing = existingRaw
      ? (JSON.parse(existingRaw) as Array<{ text: string; timestamp: number; tabId?: string; sourceType?: string }>)
      : [];
    existing.push({ text: normalized, timestamp: Date.now(), tabId, sourceType: "journal_tab" });
    const pruned = existing.slice(-50);
    window.localStorage.setItem(key, JSON.stringify(pruned));
    window.dispatchEvent(new CustomEvent("journal:recent-entry", { detail: { userId } }));
  } catch {
    // ignore
  }
}
