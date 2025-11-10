"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import type { ProgressFact } from "@/lib/progressFacts";
import { backfillProgressFacts } from "@/lib/progressFacts";
import { getDb } from "@/lib/firebase";

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
  useEffect(() => {
    if (!profileId) {
      const timeout = setTimeout(() => {
        setState({ data: null, loading: false, error: null });
        backfillRequested.current = false;
      }, 0);
      return () => clearTimeout(timeout);
    }

    const profileRef = doc(getDb(), "userProfiles", profileId);
    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        const data = snapshot.exists()
          ? ((snapshot.data().progressFacts as ProgressFact | undefined) ?? null)
          : null;
        const hasIntent = Boolean(data?.intent);
        const hasMotivation = Boolean(data?.motivation);
        const hasEvaluation = Boolean(data?.evaluation);
        const needsBackfill = !data || !hasIntent || !hasMotivation || !hasEvaluation;

        if (!needsBackfill && data) {
          setState({ data, loading: false, error: null });
          backfillRequested.current = false;
          return;
        }

        setState((prev) => ({
          data: data ?? prev.data,
          loading: true,
          error: prev.error,
        }));

        if (!backfillRequested.current) {
          backfillRequested.current = true;
          void backfillProgressFacts(profileId)
            .then((fact) => {
              setState((prev) => ({
                data: fact ?? prev.data,
                loading: false,
                error: null,
              }));
            })
            .catch((error) => {
              setState((prev) => ({
                data: prev.data,
                loading: false,
                error,
              }));
            })
            .finally(() => {
              backfillRequested.current = false;
            });
        }
      },
      (error) => {
        setState({ data: null, loading: false, error });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [profileId]);

  return state;
}
