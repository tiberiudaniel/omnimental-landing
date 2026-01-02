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
import { isE2EMode } from "@/lib/e2eMode";

export type EarnedRoundsController = {
  state: EarnedRoundState;
  canSpend: boolean;
  canEarnMore: boolean;
  spend: () => Promise<EarnedRoundState>;
  earn: () => Promise<EarnedRoundState>;
};

const todayKey = getTodayKey();
const E2E_STORAGE_KEY = "omni_e2e_earned_rounds";

function readE2EState(dayKey: string): EarnedRoundState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(E2E_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, EarnedRoundState>;
    const entry = parsed[dayKey];
    if (!entry) return null;
    return {
      dayKey,
      credits: Number.isFinite(entry.credits) ? entry.credits : 0,
      usedToday: Number.isFinite(entry.usedToday) ? entry.usedToday : 0,
    };
  } catch {
    return null;
  }
}

function writeE2EState(state: EarnedRoundState) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(E2E_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, EarnedRoundState>) : {};
    parsed[state.dayKey] = { dayKey: state.dayKey, credits: state.credits, usedToday: state.usedToday };
    window.localStorage.setItem(E2E_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function useEarnedRoundsController(progressFacts: ProgressFact | null): EarnedRoundsController {
  const e2eMode = isE2EMode();
  const derivedState = useMemo(() => {
    if (e2eMode) {
      return { dayKey: todayKey, credits: 0, usedToday: 0 };
    }
    return deriveEarnedRoundState(progressFacts, todayKey);
  }, [progressFacts, e2eMode]);
  const [state, setState] = useState<EarnedRoundState>(() => {
    if (e2eMode) {
      return readE2EState(todayKey) ?? derivedState;
    }
    return derivedState;
  });

  useEffect(() => {
    const isBrowser = typeof window !== "undefined";
    let frame: number | null = null;
    const schedule = (value: EarnedRoundState) => {
      if (isBrowser && typeof window.requestAnimationFrame === "function") {
        frame = window.requestAnimationFrame(() => setState(value));
        return;
      }
      if (typeof queueMicrotask === "function") {
        queueMicrotask(() => setState(value));
        return;
      }
      if (isBrowser) {
        frame = window.setTimeout(() => setState(value), 0);
      } else {
        setState(value);
      }
    };
    if (e2eMode) {
      const stored = readE2EState(todayKey);
      if (stored) {
        schedule(stored);
        return () => {
          if (frame !== null && isBrowser) {
            if (typeof window.cancelAnimationFrame === "function") {
              window.cancelAnimationFrame(frame);
            } else {
              window.clearTimeout(frame);
            }
          }
        };
      }
    }
    schedule(derivedState);
    return () => {
      if (frame !== null && isBrowser) {
        if (typeof window.cancelAnimationFrame === "function") {
          window.cancelAnimationFrame(frame);
        } else {
          window.clearTimeout(frame);
        }
      }
    };
  }, [derivedState, e2eMode]);

  const persist = useCallback(async (nextState: EarnedRoundState) => {
    setState(nextState);
    if (e2eMode) {
      writeE2EState(nextState);
    }
    try {
      await persistEarnedRoundState(nextState);
    } catch {
      // best-effort; Firestore write failures will reflect via progressFacts later
    }
    return nextState;
  }, [e2eMode]);

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
