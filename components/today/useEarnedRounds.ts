"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getTodayKey } from "@/lib/dailyCompletion";
import type { ProgressFact } from "@/lib/progressFacts";
import {
  deriveEarnedRoundState,
  getStateAfterEarn,
  getStateAfterSpend,
  persistEarnedRoundState,
  canSpendEarnedRound,
  hasEarnLimitAvailable,
  type EarnedRoundState,
} from "@/lib/earnedRounds";

export type EarnedRoundsController = {
  state: EarnedRoundState;
  canSpend: boolean;
  canEarnMore: boolean;
  spend: () => Promise<EarnedRoundState>;
  earn: () => Promise<EarnedRoundState>;
};

const todayKey = getTodayKey();

export function useEarnedRoundsController(progressFacts: ProgressFact | null): EarnedRoundsController {
  const derivedState = useMemo(() => deriveEarnedRoundState(progressFacts, todayKey), [progressFacts]);
  const [state, setState] = useState<EarnedRoundState>(derivedState);

  useEffect(() => {
    setState(derivedState);
  }, [derivedState]);

  const persist = useCallback(async (nextState: EarnedRoundState) => {
    setState(nextState);
    try {
      await persistEarnedRoundState(nextState);
    } catch {
      // best-effort; Firestore write failures will reflect via progressFacts later
    }
    return nextState;
  }, []);

  const spend = useCallback(async () => {
    const next = getStateAfterSpend(state);
    if (next === state) return state;
    return persist(next);
  }, [persist, state]);

  const earn = useCallback(async () => {
    const next = getStateAfterEarn(state);
    if (next === state) return state;
    return persist(next);
  }, [persist, state]);

  return {
    state,
    canSpend: canSpendEarnedRound(state),
    canEarnMore: hasEarnLimitAvailable(state),
    spend,
    earn,
  };
}
