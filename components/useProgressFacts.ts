"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import type { ProgressFact } from "@/lib/progressFacts";
import { backfillProgressFacts } from "@/lib/progressFacts";
import { getDb } from "@/lib/firebase";
import { isE2EMode } from "@/lib/e2eMode";
import { getLocalInitiationFacts } from "@/lib/content/initiationProgressStorage";

type ProgressFactsState = {
  data: ProgressFact | null;
  loading: boolean;
  error: Error | null;
};

export function useProgressFacts(profileId?: string | null): ProgressFactsState {
  const [state, setState] = useState<ProgressFactsState>(() => ({
    data: null,
    loading: Boolean(profileId),
    error: null,
  }));
  const backfillRequested = useRef(false);
  const e2eActive = isE2EMode();
  useEffect(() => {
    const mergeWithInitiationFacts = (
      facts: ProgressFact | null,
      baseSource: "remote" | "override" | "none",
    ): ProgressFact | null => {
      const initiationFacts = getLocalInitiationFacts(profileId ?? null);
      if (!facts && !initiationFacts) return null;
      const result = { ...(facts ?? {}) } as ProgressFact;
      let sourceLabel: "remote" | "local" | "merged" =
        baseSource === "none" ? "local" : baseSource === "override" ? "remote" : "remote";
      if (!result.initiation && initiationFacts) {
        result.initiation = initiationFacts;
        sourceLabel = facts ? "merged" : "local";
      }
      result.factsSource = sourceLabel;
      return result;
    };

    const maybeUseE2EOverride = (): ProgressFact | null => {
      if (typeof window === "undefined") return null;
      if (!(window as typeof window & { __OMNI_E2E__?: boolean }).__OMNI_E2E__) return null;
      const raw = window.localStorage.getItem("e2e_progress_override");
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? (parsed as ProgressFact) : null;
      } catch {
        return null;
      }
    };

    const override = maybeUseE2EOverride();
    if (override || e2eActive) {
      const resolved = mergeWithInitiationFacts(override ?? null, override ? "override" : "none");
      const commit = () => setState({ data: resolved, loading: false, error: null });
      if (typeof window === "undefined") {
        if (typeof queueMicrotask === "function") {
          queueMicrotask(commit);
        } else {
          setTimeout(commit, 0);
        }
        return () => {};
      }
      const raf = window.requestAnimationFrame(commit);
      return () => window.cancelAnimationFrame(raf);
    }

    if (!profileId) {
      const timeout = setTimeout(() => {
        setState({ data: null, loading: false, error: null });
        backfillRequested.current = false;
      }, 0);
      return () => clearTimeout(timeout);
    }
    const db = getDb();
    const profileRef = doc(db, "userProfiles", profileId);
    const factsRef = doc(db, "userProgressFacts", profileId);

    let latestProfile: ProgressFact | null = null;
    let latestFacts: ProgressFact | null = null;

    const mergeAndSet = () => {
      const merged: ProgressFact | null =
        latestProfile || latestFacts
          ? ({ ...(latestProfile ?? {}), ...(latestFacts ?? {}) } as ProgressFact)
          : null;
      setState((prev) => ({
        data: mergeWithInitiationFacts(merged, merged ? "remote" : "none") ?? prev.data,
        loading: false,
        error: null,
        }));
    };

    const unsubProfile = onSnapshot(
      profileRef,
      (snapshot) => {
        latestProfile = snapshot.exists()
          ? ((snapshot.data().progressFacts as ProgressFact | undefined) ?? null)
          : null;

        const hasProfileIntent = Boolean(latestProfile?.intent);
        const hasProfileMotivation = Boolean(latestProfile?.motivation);
        const hasProfileEvaluation = Boolean(latestProfile?.evaluation);
        const hasFactsIntent = Boolean(latestFacts?.intent);
        const hasFactsMotivation = Boolean(latestFacts?.motivation);
        const hasFactsEvaluation = Boolean(latestFacts?.evaluation);
        const needsBackfill = !(
          (hasProfileIntent || hasFactsIntent) &&
          (hasProfileMotivation || hasFactsMotivation) &&
          (hasProfileEvaluation || hasFactsEvaluation)
        );

        if (needsBackfill && !backfillRequested.current) {
          setState((prev) => ({ data: latestProfile ?? prev.data, loading: true, error: prev.error }));
          backfillRequested.current = true;
          void backfillProgressFacts(profileId)
            .then((fact) => {
              latestProfile = fact ?? latestProfile;
              mergeAndSet();
            })
            .catch((error) => setState((prev) => ({ data: prev.data, loading: false, error })))
            .finally(() => {
              backfillRequested.current = false;
            });
        } else {
          mergeAndSet();
        }
      },
      (error) => setState({ data: null, loading: false, error }),
    );

    const unsubFacts = onSnapshot(
      factsRef,
      (snapshot) => {
        latestFacts = snapshot.exists() ? ((snapshot.data() as ProgressFact | undefined) ?? null) : null;
        mergeAndSet();
      },
      () => {},
    );

    return () => {
      unsubProfile();
      unsubFacts();
    };
  }, [profileId, e2eActive]);

  return state;
}
