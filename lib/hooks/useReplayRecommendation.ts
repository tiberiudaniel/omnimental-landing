"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ensureAuth, getDb } from "@/lib/firebase";
import type { ReplayRecommendationPayload } from "@/lib/types/replay";

type ReplayRecommendationState = {
  recommendation: ReplayRecommendationPayload | null;
  loading: boolean;
  error: string | null;
};

export function useReplayRecommendation(enabled: boolean) {
  const [state, setState] = useState<ReplayRecommendationState>(() => ({
    recommendation: null,
    loading: Boolean(enabled),
    error: null,
  }));
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (!enabled) {
        if (!cancelled) {
          setState({ recommendation: null, loading: false, error: null });
        }
        return;
      }
      if (!cancelled) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }
      try {
        const user = await ensureAuth();
        if (!user?.uid) {
          if (!cancelled) {
            setState({ recommendation: null, loading: false, error: null });
          }
          return;
        }
        const snap = await getDoc(doc(getDb(), "userReplayData", user.uid));
        const data = snap.exists()
          ? ((snap.data() as { lastRecommendation?: ReplayRecommendationPayload | null })?.lastRecommendation ?? null)
          : null;
        if (!cancelled) {
          setState({ recommendation: data, loading: false, error: null });
        }
      } catch (error) {
        console.warn("load replay recommendation failed", error);
        if (!cancelled) {
          setState({
            recommendation: null,
            loading: false,
            error: "Nu am putut încărca recomandarea de replay.",
          });
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, reloadToken]);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    recommendation: state.recommendation,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
