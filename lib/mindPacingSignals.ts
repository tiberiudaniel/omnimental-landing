"use client";

import type { CatAxisId } from "@/lib/profileEngine";

export type MindPacingSignalTag = "brain_fog" | "overthinking" | "task_switching" | "somatic_tension";

export const MINDPACING_OPTION_SIGNAL: Record<string, MindPacingSignalTag> = {
  noise_fog: "brain_fog",
  noise_story: "overthinking",
  noise_scatter: "task_switching",
  noise_tension: "somatic_tension",
};

export const MINDPACING_SIGNAL_AXIS: Record<MindPacingSignalTag, CatAxisId> = {
  brain_fog: "clarity",
  overthinking: "clarity",
  task_switching: "clarity",
  somatic_tension: "energy",
};

export const MINDPACING_SIGNAL_VOCAB: Record<MindPacingSignalTag, string> = {
  brain_fog: "clarity_fog",
  overthinking: "clarity_story_strip",
  task_switching: "focus_scattered",
  somatic_tension: "emo_tense",
};

const SIGNAL_KEYS = Object.keys(MINDPACING_SIGNAL_AXIS) as MindPacingSignalTag[];

export function getMindPacingSignalFromOption(optionId?: string | null): MindPacingSignalTag | null {
  if (!optionId) return null;
  return MINDPACING_OPTION_SIGNAL[optionId] ?? null;
}

export function isMindPacingSignalTag(value: string | null | undefined): value is MindPacingSignalTag {
  if (!value) return false;
  return SIGNAL_KEYS.includes(value as MindPacingSignalTag);
}

export function getAxisFromMindPacingSignal(signal?: MindPacingSignalTag | null): CatAxisId | null {
  if (!signal) return null;
  return MINDPACING_SIGNAL_AXIS[signal] ?? null;
}
