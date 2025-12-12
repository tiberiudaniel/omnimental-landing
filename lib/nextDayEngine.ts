import type { DailyPathConfig, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { CatProfileDoc } from "@/types/cat";
import { deriveAdaptiveClusterFromCat, mapAxisToCluster } from "@/lib/dailyCluster";
import { getDailyPathForCluster } from "@/config/dailyPath";
import type { AdaptiveCluster } from "@/types/dailyPath";
import type { CatAxisId } from "@/config/catEngine";
import { getDailyPracticeHistory } from "@/lib/dailyPracticeStore";
import type { DailyPracticeDoc } from "@/types/dailyPractice";

const FALLBACK_CLUSTER: AdaptiveCluster = "clarity_cluster";
const FALLBACK_MODE: DailyPathMode = "short";
const CLUSTER_ROTATION: AdaptiveCluster[] = [
  "clarity_cluster",
  "emotional_flex_cluster",
  "focus_energy_cluster",
];

export interface NextDayDecision {
  config: DailyPathConfig;
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  reason: string;
}

function getAxisOrder(profile: CatProfileDoc | null | undefined): Array<[CatAxisId, number]> {
  if (!profile?.axisScores) return [];
  return Object.entries(profile.axisScores)
    .map(([axisId, score]) => [axisId as CatAxisId, score] as [CatAxisId, number])
    .sort((a, b) => a[1] - b[1]);
}

function pickAlternateCluster(
  axisOrder: Array<[CatAxisId, number]>,
  current: AdaptiveCluster,
): AdaptiveCluster {
  for (const [axisId] of axisOrder) {
    const candidate = mapAxisToCluster(axisId);
    if (candidate !== current) {
      return candidate;
    }
  }
  const index = CLUSTER_ROTATION.indexOf(current);
  if (index === -1) return current;
  return CLUSTER_ROTATION[(index + 1) % CLUSTER_ROTATION.length];
}

function clusterLabel(cluster: AdaptiveCluster): string {
  switch (cluster) {
    case "clarity_cluster":
      return "clarity";
    case "emotional_flex_cluster":
      return "emotional_flex";
    default:
      return "focus_energy";
  }
}

function countConsecutiveDaysOnCluster(history: DailyPracticeDoc[], cluster: AdaptiveCluster): number {
  let counter = 0;
  for (const entry of history) {
    if (entry.cluster !== cluster) break;
    if (!entry.completed) break;
    counter += 1;
  }
  return counter;
}

function fallbackDecision(lang: DailyPathLanguage, reason: string): NextDayDecision {
  const config = getDailyPathForCluster({
    cluster: FALLBACK_CLUSTER,
    mode: FALLBACK_MODE,
    lang,
  });
  return {
    config,
    cluster: FALLBACK_CLUSTER,
    mode: FALLBACK_MODE,
    reason,
  };
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

  const axisOrder = getAxisOrder(catProfile);
  const derived = deriveAdaptiveClusterFromCat(catProfile);
  let chosenCluster: AdaptiveCluster = derived.cluster ?? FALLBACK_CLUSTER;
  const reasonParts: string[] = [`weakest axis: ${derived.primaryAxis ?? "n/a"}`];

  const history = await getDailyPracticeHistory(userId, 14);
  const consecutiveOnWeakest = countConsecutiveDaysOnCluster(history, chosenCluster);
  reasonParts.push(`consecutive on ${clusterLabel(chosenCluster)}=${consecutiveOnWeakest}`);

  if (consecutiveOnWeakest >= 3) {
    const alternateCluster = pickAlternateCluster(axisOrder, chosenCluster);
    if (alternateCluster !== chosenCluster) {
      reasonParts.push(
        `switching cluster after ${consecutiveOnWeakest} days → ${clusterLabel(alternateCluster)}`,
      );
      chosenCluster = alternateCluster;
    }
  }

  const yesterday = history[0];
  let chosenMode: DailyPathMode = FALLBACK_MODE;
  if (yesterday && yesterday.cluster === chosenCluster) {
    if (!yesterday.completed) {
      reasonParts.push("yesterday incomplete → short mode");
    } else {
      const lastOnCluster = history.filter((entry) => entry.cluster === chosenCluster).slice(0, 3);
      const allCompleted = lastOnCluster.length === 3 && lastOnCluster.every((entry) => entry.completed);
      chosenMode = allCompleted ? "deep" : "short";
      reasonParts.push(allCompleted ? "3 completions on cluster → deep" : "insufficient streak → short");
    }
  } else {
    reasonParts.push("new cluster today → short");
  }

  const config = getDailyPathForCluster({ cluster: chosenCluster, mode: chosenMode, lang });
  reasonParts.push(`selected ${clusterLabel(chosenCluster)} / ${chosenMode} / ${lang}`);
  return {
    config,
    cluster: chosenCluster,
    mode: chosenMode,
    reason: reasonParts.join(" | "),
  };
}
