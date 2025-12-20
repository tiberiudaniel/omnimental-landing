import type { DailyPathConfig, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { CatProfileDoc } from "@/types/cat";
import { deriveAdaptiveClusterFromCat } from "@/lib/dailyCluster";
import {
  getDailyPathForCluster,
  getDailyPathConfigById,
  getDefaultModuleKey,
  getModuleKeyForConfigId,
  getNextModuleKey,
} from "@/config/dailyPath";
import type { AdaptiveCluster } from "@/types/dailyPath";
import { getDailyPracticeHistory, getCurrentDateKey } from "@/lib/dailyPracticeStore";
import { CLUSTER_ROTATION, getClusterMeta } from "@/config/clusterRegistry";
import {
  countConsecutiveDaysOnCluster,
  daysBetween,
  sortEntriesByDayDesc,
  normalizeDailyEntries,
} from "@/lib/dailyPathHistory";
import { computeAbandonRate } from "@/lib/abandonmentRate";
import {
  applyDecisionPolicyV2,
  type DecisionBaseline,
  type PolicySignals,
  type PolicyDecision,
  type DailyVariant,
} from "@/lib/decisionPolicyV2";
import { WOW_DAY_SEQUENCE, isWowModuleKey as isWowModuleKeyFromConfig } from "@/config/dailyPaths/wow";
// NOTE: Policy signals should prefer per-cluster reliability to avoid penalizing today's cluster for other clusters' abandonments.
import type { DailyPracticeDoc } from "@/types/dailyPractice";

const FALLBACK_CLUSTER: AdaptiveCluster = CLUSTER_ROTATION[0];
const FALLBACK_MODE: DailyPathMode = "short";
const IS_DEV = process.env.NODE_ENV !== "production";
const WOW_MODULE_KEYS = new Set(WOW_DAY_SEQUENCE.map((entry) => entry.moduleKey));
const isWowModuleKey = (value: string | null | undefined): boolean => isWowModuleKeyFromConfig(value);
const HISTORY_LOOKBACK_DAYS = Math.max(30, WOW_DAY_SEQUENCE.length + 10);
type NormalizedDailyEntry = ReturnType<typeof normalizeDailyEntries>[number];

export interface NextDayDecision {
  config: DailyPathConfig;
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  reason: string;
  moduleKey?: string | null;
  variant?: DailyVariant;
  policyApplied?: boolean;
  policyReason?: string;
  skipPolicy?: boolean;
}

function resolveModuleKeyFromEntry(entry: DailyPracticeDoc | null | undefined): string | null {
  if (!entry?.configId) return null;
  return getModuleKeyForConfigId(entry.configId) ?? null;
}

function resolveConfigForEntry(
  entry: DailyPracticeDoc | null | undefined,
  fallbackLang: DailyPathLanguage,
): { config: DailyPathConfig; moduleKey: string | null } | null {
  if (!entry) return null;
  if (entry.configId) {
    const config = getDailyPathConfigById(entry.configId);
    if (config) {
      return { config, moduleKey: config.moduleKey ?? resolveModuleKeyFromEntry(entry) };
    }
  }
  const moduleKey = resolveModuleKeyFromEntry(entry);
  if (!moduleKey) return null;
  const config = getDailyPathForCluster({
    cluster: entry.cluster,
    mode: entry.mode,
    lang: entry.lang ?? fallbackLang,
    moduleKey,
  });
  return { config, moduleKey };
}

function createWowDecision(
  target: { cluster: AdaptiveCluster; moduleKey: string },
  lang: DailyPathLanguage,
  reason: string,
): NextDayDecision {
  const config = getDailyPathForCluster({
    cluster: target.cluster,
    mode: "deep",
    lang,
    moduleKey: target.moduleKey,
  });
  return {
    config,
    cluster: target.cluster,
    mode: "deep",
    reason,
    moduleKey: target.moduleKey,
    skipPolicy: true,
  };
}

function pickWowDecision(
  normalizedEntries: NormalizedDailyEntry[],
  lang: DailyPathLanguage,
): NextDayDecision | null {
  const completedKeys = new Set<string>();
  normalizedEntries.forEach(({ entry }) => {
    if (!entry.completed) return;
    const moduleKey = resolveModuleKeyFromEntry(entry);
    if (moduleKey && WOW_MODULE_KEYS.has(moduleKey)) {
      completedKeys.add(moduleKey);
    }
  });

  const nextIndex = WOW_DAY_SEQUENCE.findIndex(
    (entry) => !completedKeys.has(entry.moduleKey),
  );
  if (nextIndex === -1) {
    return null;
  }
  const target = WOW_DAY_SEQUENCE[nextIndex];
  return createWowDecision(
    target,
    lang,
    `wow_sequence_day=${nextIndex + 1} module=${target.moduleKey}`,
  );
}

function pickRepeatDecisionForToday(
  normalizedEntries: NormalizedDailyEntry[],
  fallbackLang: DailyPathLanguage,
  todayKey: string,
): NextDayDecision | null {
  const todaysEntry = normalizedEntries.find((row) => row.dayKey === todayKey)?.entry ?? null;
  if (!todaysEntry) return null;
  const resolved = resolveConfigForEntry(todaysEntry, fallbackLang);
  if (!resolved) return null;
  const { config, moduleKey } = resolved;
  return {
    config,
    cluster: config.cluster,
    mode: config.mode,
    reason: `repeat_day=${todayKey} config=${todaysEntry.configId}`,
    moduleKey: moduleKey ?? config.moduleKey ?? null,
    skipPolicy: true,
  };
}

function clusterLabel(cluster: AdaptiveCluster): string {
  return getClusterMeta(cluster).label;
}

function fallbackDecision(lang: DailyPathLanguage, reason: string): NextDayDecision {
  const moduleKey = getDefaultModuleKey(FALLBACK_CLUSTER);
  const config = getDailyPathForCluster({
    cluster: FALLBACK_CLUSTER,
    mode: FALLBACK_MODE,
    lang,
    moduleKey,
  });
  return {
    config,
    cluster: FALLBACK_CLUSTER,
    mode: FALLBACK_MODE,
    reason,
    moduleKey,
  };
}

export interface NextDayHistoryContext {
  catProfile: CatProfileDoc | null;
  lang: DailyPathLanguage;
  history: DailyPracticeDoc[];
  todayKey?: string;
}

export function decideNextDailyPathFromHistory(context: NextDayHistoryContext): NextDayDecision {
  const { catProfile, lang, history, todayKey = getCurrentDateKey() } = context;
  const normalizedEntries = normalizeDailyEntries(history);
  const missingMappingId = findFirstMissingConfigId(history);
  const repeatDecision = pickRepeatDecisionForToday(normalizedEntries, lang, todayKey);
  if (repeatDecision) {
    return annotateDecisionWithMissingMapping(repeatDecision, missingMappingId);
  }
  const wowDecision = pickWowDecision(normalizedEntries, lang);
  if (wowDecision) {
    return annotateDecisionWithMissingMapping(wowDecision, missingMappingId);
  }
  if (!catProfile) {
    return annotateDecisionWithMissingMapping(
      fallbackDecision(lang, "fallback: missing CAT profile"),
      missingMappingId,
    );
  }
  const derived = deriveAdaptiveClusterFromCat(catProfile);
  const chosenCluster: AdaptiveCluster = derived.cluster ?? FALLBACK_CLUSTER;
  const reasonParts: string[] = [`weakest axis: ${derived.primaryAxis ?? "n/a"}`];

  const sortedHistory = sortEntriesByDayDesc(history);
  const clusterHistory = sortedHistory.filter((entry) => entry.cluster === chosenCluster);
  const consecutiveOnWeakest = countConsecutiveDaysOnCluster(clusterHistory);
  reasonParts.push(`${clusterLabel(chosenCluster)} consecutive completions=${consecutiveOnWeakest}`);

  const normalizedClusterEntries = normalizeDailyEntries(clusterHistory);
  const mostRecentForCluster = normalizedClusterEntries[0] ?? null;
  const lastCompletedEntries = normalizedClusterEntries
    .filter(({ entry }) => entry.completed)
    .slice(0, 3);

  let chosenMode: DailyPathMode = FALLBACK_MODE;
  if (mostRecentForCluster) {
    const diffFromToday = Math.abs(daysBetween(todayKey, mostRecentForCluster.dayKey));
    if (diffFromToday === 0) {
      reasonParts.push("cluster attempted today already → short");
      chosenMode = "short";
    } else if (diffFromToday === 1 && mostRecentForCluster.entry.completed) {
      if (lastCompletedEntries.length === 3) {
        reasonParts.push("last 3 completions on cluster → deep");
        chosenMode = "deep";
      } else {
        reasonParts.push(
          `cluster completed previous_day but streak=${lastCompletedEntries.length} < 3 → short`,
        );
      }
    } else {
      reasonParts.push("cluster not completed previous_day → short");
    }
  } else {
    reasonParts.push("cluster has_no_history → short");
  }

  const moduleSelection = selectModuleKeyForCluster(chosenCluster, clusterHistory);
  const moduleKey = moduleSelection.moduleKey;
  if (moduleSelection.mappingMissingConfigId) {
    console.warn(
      `[NextDayEngine] Missing moduleKey mapping for configId=${moduleSelection.mappingMissingConfigId}`,
    );
    reasonParts.push(`mapping=${moduleSelection.mappingMissingConfigId}->default`);
    reasonParts.push(`fallback_key=${moduleSelection.fallbackKey ?? "default"}`);
  }
  reasonParts.push(`module=${moduleKey ?? "default"}`);
  const config = getDailyPathForCluster({
    cluster: chosenCluster,
    mode: chosenMode,
    lang,
    moduleKey: moduleKey ?? undefined,
  });
  const reason = `${reasonParts.join(" | ")} | selected ${clusterLabel(chosenCluster)} / ${chosenMode} / ${lang}`;
  if (IS_DEV && (process.env.DEBUG_NEXTDAY === "1" || process.env.NODE_ENV !== "test")) {
    console.debug("[NextDayEngine]", {
      cluster: chosenCluster,
      mode: chosenMode,
      historyCount: history.length,
      reason,
    });
  }
  return {
    config,
    cluster: chosenCluster,
    mode: chosenMode,
    reason,
    moduleKey,
  };
}

function findFirstMissingConfigId(entries: DailyPracticeDoc[]): string | null {
  for (const entry of entries) {
    const id = entry.configId;
    if (!id) continue;
    const mapped = getModuleKeyForConfigId(id);
    if (!mapped) {
      return id;
    }
  }
  return null;
}

function annotateDecisionWithMissingMapping(
  decision: NextDayDecision,
  missingConfigId: string | null,
): NextDayDecision {
  if (!missingConfigId) return decision;
  console.warn(
    `[NextDayEngine] Missing moduleKey mapping for configId=${missingConfigId}`,
  );
  return {
    ...decision,
    reason: `${decision.reason} | mapping=${missingConfigId}->default`,
  };
}

interface ModuleSelectionResult {
  moduleKey: string | null;
  mappingMissingConfigId: string | null;
  fallbackKey: string | null;
}

function selectModuleKeyForCluster(
  cluster: AdaptiveCluster,
  clusterHistory: DailyPracticeDoc[],
): ModuleSelectionResult {
  const defaultKey = getDefaultModuleKey(cluster);
  const normalizedEntries = normalizeDailyEntries(clusterHistory);
  const latestEntry = normalizedEntries[0]?.entry ?? null;
  if (!latestEntry) {
    return { moduleKey: defaultKey, mappingMissingConfigId: null, fallbackKey: defaultKey };
  }
  const mappedKey =
    (latestEntry.configId ? getModuleKeyForConfigId(latestEntry.configId) : null) ?? null;
  if (!mappedKey) {
    return {
      moduleKey: defaultKey,
      mappingMissingConfigId: latestEntry.configId ?? null,
      fallbackKey: defaultKey,
    };
  }
  if (!latestEntry.completed) {
    return { moduleKey: mappedKey, mappingMissingConfigId: null, fallbackKey: defaultKey };
  }
  const nextKey = getNextModuleKey(cluster, mappedKey) ?? mappedKey ?? defaultKey;
  return { moduleKey: nextKey, mappingMissingConfigId: null, fallbackKey: defaultKey };
}

export async function decideNextDailyPath(params: {
  userId: string | null;
  catProfile: CatProfileDoc | null;
  lang: DailyPathLanguage;
}): Promise<NextDayDecision> {
  const { userId, catProfile, lang } = params;
  if (!userId || !catProfile) {
    return fallbackDecision(lang, "fallback: missing userId or CAT profile");
  }
  const history = await getDailyPracticeHistory(userId, HISTORY_LOOKBACK_DAYS);
  const baselineDecision = decideNextDailyPathFromHistory({
    catProfile,
    lang,
    history,
    todayKey: getCurrentDateKey(),
  });
  if (baselineDecision.skipPolicy || isWowModuleKey(baselineDecision.moduleKey)) {
    return baselineDecision;
  }

  const normalizedEntries = normalizeDailyEntries(history);
  const clusterAbandonmentEntries = normalizedEntries
    .filter(({ entry }) => entry.cluster === baselineDecision.cluster)
    .map(({ dayKey, entry }) => ({
      dayKey,
      completed: Boolean(entry.completed),
      mode: entry.mode,
    }));
  const deepAbandonRate =
    computeAbandonRate(clusterAbandonmentEntries, { mode: "deep", lastNDays: 14 }) ?? undefined;
  const overallAbandonRate =
    computeAbandonRate(clusterAbandonmentEntries, { lastNDays: 14 }) ?? undefined;

  const baseline: DecisionBaseline = {
    cluster: baselineDecision.cluster,
    mode: baselineDecision.mode,
    lang,
    reason: baselineDecision.reason,
    historyCount: history.length,
    configId: baselineDecision.config.id,
  };
  const signals: PolicySignals = {
    deepAbandonRate,
    overallAbandonRate,
  };

  const policyDecision: PolicyDecision = applyDecisionPolicyV2(baseline, signals);
  const finalReason = policyDecision.policyApplied
    ? `${baselineDecision.reason} | policy: ${policyDecision.policyReason}`
    : baselineDecision.reason;

  const finalDecision: NextDayDecision = {
    ...baselineDecision,
    mode: policyDecision.mode,
    reason: finalReason,
    policyApplied: policyDecision.policyApplied,
    policyReason: policyDecision.policyReason,
  };
  if (policyDecision.variant) {
    finalDecision.variant = policyDecision.variant;
  }
  if (IS_DEV && (process.env.DEBUG_NEXTDAY === "1" || process.env.NODE_ENV !== "test")) {
    console.debug("[DecisionPolicyV2]", {
      signals,
      policyApplied: policyDecision.policyApplied,
      policyReason: policyDecision.policyReason,
      finalMode: policyDecision.mode,
      variant: policyDecision.variant ?? "challenge",
    });
  }
  return finalDecision;
}

export const __testables = {
  selectModuleKeyForClusterRaw: (cluster: AdaptiveCluster, history: DailyPracticeDoc[]) =>
    selectModuleKeyForCluster(cluster, history),
};
