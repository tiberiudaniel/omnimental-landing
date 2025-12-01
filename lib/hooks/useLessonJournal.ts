"use client";

import { useCallback, useEffect, useState } from "react";
import { appendLessonJournalBlock, getLessonJournalEntry } from "@/lib/db/lessonJournal";
import type { LessonJournalEntry } from "@/lib/types/journal";

export function useLessonJournal(
  userId: string | null | undefined,
  moduleId: string,
  lessonId: string,
  lessonTitle: string,
) {
  const [entry, setEntry] = useState<LessonJournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!userId) {
        await Promise.resolve();
        if (cancelled) return;
        setEntry(null);
        setLoading(false);
        setError(null);
        return;
      }
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getLessonJournalEntry(userId, moduleId, lessonId);
        if (!cancelled) {
          setEntry(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("lesson journal load failed", err);
          setError("Nu am putut încărca jurnalul.");
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [userId, moduleId, lessonId]);

  const addNote = useCallback(
    async (text: string, kind: "note" | "snippet" = "note") => {
      const trimmed = text.trim();
      if (!trimmed) {
        setError("Scrie câteva idei înainte de a salva.");
        return null;
      }
      if (!userId) {
        setError("Salvează-ți contul pentru a păstra jurnalul lecției.");
        return null;
      }
      try {
        setError(null);
        const updated = await appendLessonJournalBlock(userId, moduleId, lessonId, lessonTitle, {
          text: trimmed,
          kind,
          screenId: null,
        });
        setEntry(updated);
        return updated;
      } catch (err) {
        console.error("lesson journal add failed", err);
        setError("Nu am putut salva nota. Încearcă din nou.");
        return null;
      }
    },
    [lessonId, lessonTitle, moduleId, userId],
  );

  return {
    entry,
    loading,
    error,
    addNote,
    canWrite: Boolean(userId),
  } as const;
}
