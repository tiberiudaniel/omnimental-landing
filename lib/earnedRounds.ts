import { getTodayKey } from "./dailyCompletion";
import type { ProgressFact } from "./progressFacts";
import { recordEarnedRoundState } from "./progressFacts/recorders";

export const MAX_EARNED_ROUND_CREDITS = 3;

export type EarnedRoundState = {
  dayKey: string;
  credits: number;
  usedToday: number;
};

const clamp = (value: number, min = 0, max = MAX_EARNED_ROUND_CREDITS) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

export function deriveEarnedRoundState(progressFacts: ProgressFact | null, todayKey: string = getTodayKey()): EarnedRoundState {
  const source = progressFacts?.stats?.earnedRounds;
  if (!source || !source.dayKey || source.dayKey !== todayKey) {
    const credits = clamp(source?.credits ?? 0);
    return { dayKey: todayKey, credits, usedToday: 0 };
  }
  return {
    dayKey: todayKey,
    credits: clamp(source.credits ?? 0),
    usedToday: clamp(source.usedToday ?? 0),
  };
}

export function canSpendEarnedRound(state: EarnedRoundState): boolean {
  return state.credits > 0 && state.usedToday < MAX_EARNED_ROUND_CREDITS;
}

export function hasEarnLimitAvailable(state: EarnedRoundState): boolean {
  return state.credits + state.usedToday < MAX_EARNED_ROUND_CREDITS;
}

export function getStateAfterSpend(state: EarnedRoundState): EarnedRoundState {
  if (!canSpendEarnedRound(state)) return state;
  return {
    ...state,
    credits: clamp(state.credits - 1),
    usedToday: clamp(state.usedToday + 1),
  };
}

export function getStateAfterEarn(state: EarnedRoundState): EarnedRoundState {
  if (state.credits + state.usedToday >= MAX_EARNED_ROUND_CREDITS) return state;
  return {
    ...state,
    credits: clamp(state.credits + 1),
  };
}

export async function persistEarnedRoundState(state: EarnedRoundState): Promise<void> {
  await recordEarnedRoundState(state);
}
