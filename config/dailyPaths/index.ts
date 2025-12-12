import type { AdaptiveCluster, DailyPathConfig, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import { ENERGY_DEEP_RO } from "./energy/deep.ro";
import { ENERGY_DEEP_EN } from "./energy/deep.en";
import { ENERGY_SHORT_RO } from "./energy/short.ro";
import { ENERGY_SHORT_EN } from "./energy/short.en";
import { CLARITY_DEEP_RO } from "./clarity/deep.ro";
import { CLARITY_DEEP_EN } from "./clarity/deep.en";
import { CLARITY_SHORT_RO } from "./clarity/short.ro";
import { CLARITY_SHORT_EN } from "./clarity/short.en";
import { EMOTIONAL_FLEX_DEEP_RO } from "./emotional_flex/deep.ro";
import { EMOTIONAL_FLEX_DEEP_EN } from "./emotional_flex/deep.en";
import { EMOTIONAL_FLEX_SHORT_RO } from "./emotional_flex/short.ro";
import { EMOTIONAL_FLEX_SHORT_EN } from "./emotional_flex/short.en";

export const DAILY_PATHS_DEEP_RO: Record<AdaptiveCluster, DailyPathConfig> = {
  focus_energy_cluster: ENERGY_DEEP_RO,
  clarity_cluster: CLARITY_DEEP_RO,
  emotional_flex_cluster: EMOTIONAL_FLEX_DEEP_RO,
};

export const DAILY_PATHS_DEEP_EN: Record<AdaptiveCluster, DailyPathConfig> = {
  focus_energy_cluster: ENERGY_DEEP_EN,
  clarity_cluster: CLARITY_DEEP_EN,
  emotional_flex_cluster: EMOTIONAL_FLEX_DEEP_EN,
};

export const DAILY_PATHS_SHORT_RO: Record<AdaptiveCluster, DailyPathConfig> = {
  focus_energy_cluster: ENERGY_SHORT_RO,
  clarity_cluster: CLARITY_SHORT_RO,
  emotional_flex_cluster: EMOTIONAL_FLEX_SHORT_RO,
};

export const DAILY_PATHS_SHORT_EN: Record<AdaptiveCluster, DailyPathConfig> = {
  focus_energy_cluster: ENERGY_SHORT_EN,
  clarity_cluster: CLARITY_SHORT_EN,
  emotional_flex_cluster: EMOTIONAL_FLEX_SHORT_EN,
};

export function getDailyPathForCluster(params: {
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  lang: DailyPathLanguage;
}): DailyPathConfig {
  const { cluster, mode, lang } = params;
  const collections = mode === "short"
    ? lang === "en" ? DAILY_PATHS_SHORT_EN : DAILY_PATHS_SHORT_RO
    : lang === "en" ? DAILY_PATHS_DEEP_EN : DAILY_PATHS_DEEP_RO;
  const config = collections[cluster];
  if (!config) {
    throw new Error(`DailyPath config missing for ${cluster} mode=${mode} lang=${lang}`);
  }
  return config;
}
