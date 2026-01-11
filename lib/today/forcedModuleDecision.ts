import { getDailyPathForCluster } from "@/config/dailyPath";
import type { AdaptiveCluster, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { NextDayDecision } from "@/lib/nextDayEngine";

export type ForcedModuleConfig = {
  moduleKey: string;
  cluster: AdaptiveCluster;
  mode?: DailyPathMode;
  lang?: DailyPathLanguage;
};

type ForcedDecisionDefaults = {
  lang: DailyPathLanguage;
  mode?: DailyPathMode;
};

export function buildForcedDailyDecision(
  forced: ForcedModuleConfig,
  defaults: ForcedDecisionDefaults,
): NextDayDecision {
  const lang = forced.lang ?? defaults.lang;
  const mode = forced.mode ?? defaults.mode ?? "deep";
  const config = getDailyPathForCluster({
    cluster: forced.cluster,
    mode,
    lang,
    moduleKey: forced.moduleKey,
  });
  return {
    config,
    cluster: config.cluster,
    mode: config.mode,
    reason: "forced_module_key",
    moduleKey: forced.moduleKey,
    skipPolicy: true,
  };
}
