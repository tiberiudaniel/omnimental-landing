import type { DailyPathConfig, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { CatProfileDoc } from "@/types/cat";
import { deriveAdaptiveClusterFromCat } from "@/lib/dailyCluster";
import {
  getDailyPathForCluster,
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
// NOTE: Policy signals should prefer per-cluster reliability to avoid penalizing today's cluster for other clusters' abandonments.
import type { DailyPracticeDoc } from "@/types/dailyPractice";

const FALLBACK_CLUSTER: AdaptiveCluster = CLUSTER_ROTATION[0];
const FALLBACK_MODE: DailyPathMode = "short";
const IS_DEV = process.env.NODE_ENV !== "production";

export interface NextDayDecision {
  config: DailyPathConfig;
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  reason: string;
  moduleKey?: string | null;
  variant?: DailyVariant;
  policyApplied?: boolean;
  policyReason?: string;
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
  if (!catProfile) {
    return fallbackDecision(lang, "fallback: missing CAT profile");
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
  const history = await getDailyPracticeHistory(userId, 14);
  const baselineDecision = decideNextDailyPathFromHistory({
    catProfile,
    lang,
    history,
    todayKey: getCurrentDateKey(),
  });

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
