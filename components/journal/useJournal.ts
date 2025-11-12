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
      } catch (e) {
        console.error("journal load failed", e);
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
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
    async (tabId: JournalTabId, context?: JournalContext) => {
      if (!userId) return;
      const text = state.tabs[tabId] ?? "";
      if ((text ?? "").trim() === (lastSavedRef.current[tabId] ?? "").trim()) {
        return;
      }
      setState((s) => ({ ...s, saving: true }));
      try {
        await updateJournalTab(userId, tabId, {
          text,
          theme: context?.theme ?? null,
          sourcePage: context?.sourcePage ?? null,
          sourceBlock: context?.sourceBlock ?? null,
        });
        // Fire-and-forget text analytics (best-effort)
        void recordTextSignals({ text, source: `journal:${tabId}`, context: context as Record<string, unknown> | undefined });
        lastSavedRef.current[tabId] = text;
      } catch (e) {
        console.error("journal save failed", e);
      } finally {
        setState((s) => ({ ...s, saving: false }));
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
