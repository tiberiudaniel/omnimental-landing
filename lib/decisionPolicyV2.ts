import type { AdaptiveCluster, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";

export type DailyMode = DailyPathMode;
export type DailyVariant = "challenge" | "soft";

export type DecisionBaseline = {
  cluster: AdaptiveCluster;
  mode: DailyMode;
  lang: DailyPathLanguage;
  reason: string;
  historyCount: number;
  configId?: string;
};

export type PolicySignals = {
  timeAvailableMin?: number;
  energyLevel?: "low" | "medium" | "high";
  deepAbandonRate?: number;
  overallAbandonRate?: number;
};

export type PolicyConfig = {
  minMinutesForDeep: number;
  lowEnergyDowngrade: boolean;
  maxDeepAbandonRate: number;
  enableSoftVariant: boolean;
  maxOverallAbandonRateForChallenge: number;
};

export type PolicyDecision = DecisionBaseline & {
  variant?: DailyVariant;
  policyReason: string;
  policyApplied: boolean;
};

const DEFAULT_CFG: PolicyConfig = {
  minMinutesForDeep: 10,
  lowEnergyDowngrade: true,
  maxDeepAbandonRate: 0.5,
  enableSoftVariant: true,
  maxOverallAbandonRateForChallenge: 0.6,
};

function sanitizeTime(value: number | undefined): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  if (value <= 0) return null;
  return Math.round(value);
}

function clampRate(value: number | undefined): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(value, 0), 1);
}

export function applyDecisionPolicyV2(
  baseline: DecisionBaseline,
  signals: PolicySignals,
  cfg?: Partial<PolicyConfig>,
): PolicyDecision {
  const config: PolicyConfig = { ...DEFAULT_CFG, ...(cfg ?? {}) };
  const reasons: string[] = [];
  let mode: DailyMode = baseline.mode;
  let variant: DailyVariant | undefined;

  const timeAvailable = sanitizeTime(signals.timeAvailableMin);
  const deepAbandonRate = clampRate(signals.deepAbandonRate);
  const overallAbandonRate = clampRate(signals.overallAbandonRate);

  if (timeAvailable !== null) {
    if (timeAvailable >= config.minMinutesForDeep && mode === "short") {
      mode = "deep";
      reasons.push(`timeAvailable=${timeAvailable}>=${config.minMinutesForDeep} → deep`);
    } else if (timeAvailable < config.minMinutesForDeep && mode === "deep") {
      mode = "short";
      reasons.push(`timeAvailable=${timeAvailable}<${config.minMinutesForDeep} → short`);
    }
  }

  if (mode === "deep") {
    if (config.lowEnergyDowngrade && signals.energyLevel === "low") {
      mode = "short";
      reasons.push("energy=low → short");
    }
    if (deepAbandonRate !== null && deepAbandonRate > config.maxDeepAbandonRate) {
      mode = "short";
      reasons.push(
        `deepAbandonRate=${deepAbandonRate.toFixed(2)}>${config.maxDeepAbandonRate} → short`,
      );
    }
  }

  if (config.enableSoftVariant) {
    if (
      overallAbandonRate !== null &&
      overallAbandonRate > config.maxOverallAbandonRateForChallenge
    ) {
      variant = "soft";
      reasons.push(
        `overallAbandonRate=${overallAbandonRate.toFixed(2)}>${config.maxOverallAbandonRateForChallenge} → soft`,
      );
    }
  }

  if (!reasons.length) {
    reasons.push("no change");
  }

  const policyApplied = mode !== baseline.mode || variant !== undefined;

  return {
    ...baseline,
    mode,
    variant,
    policyApplied,
    policyReason: reasons.join(" | "),
  };
}
