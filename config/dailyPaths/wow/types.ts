import type { AdaptiveCluster, DailyPathLanguage } from "@/types/dailyPath";

export type WowSectionName =
  | "HOOK"
  | "MIRROR"
  | "CORE INSIGHT"
  | "ACTIVE CHECK"
  | "MICRO-SIMULATOR"
  | "REAL-WORLD TRANSFER"
  | "ANCHOR PHRASE"
  | "CLOSE";

export type WowActiveCheck = {
  question: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  feedback: string;
};

export type WowSectionContent = {
  hook?: string;
  mirror?: string;
  coreInsight?: string;
  activeCheck?: WowActiveCheck;
  microSimulator?: string;
  realWorld?: string;
  anchorPhrase?: string;
  close?: string;
};

export type WowModuleVariants = {
  deep: Record<DailyPathLanguage, WowSectionContent>;
  short: Record<DailyPathLanguage, WowSectionContent>;
};

export interface WowModuleContent {
  moduleKey: string;
  cluster: AdaptiveCluster;
  titles: Record<DailyPathLanguage, string>;
  sections: WowModuleVariants;
}
