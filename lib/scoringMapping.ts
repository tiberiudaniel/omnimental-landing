"use client";

import type { DimensionScores } from "./scoring";
import type {
  CatAxisId,
  CanonDomainId,
  DomainId,
  DomainPreference,
  CatProfilePatch,
} from "./profileEngine";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";

const MODULE_TO_AXIS: Partial<Record<OmniKunoModuleId, CatAxisId>> = {
  focus_clarity: "clarity",
  decision_discernment: "focus",
  relationships_communication: "recalibration",
  emotional_balance: "emotionalStability",
  energy_body: "energy",
  self_trust: "adaptiveConfidence",
  willpower_perseverance: "flexibility",
  optimal_weight_management: "energy",
};

const MODULE_TO_CANON_DOMAIN: Partial<Record<OmniKunoModuleId, CanonDomainId>> = {
  focus_clarity: "decisionalClarity",
  decision_discernment: "decisionalClarity",
  relationships_communication: "emotionalRegulation",
  emotional_balance: "emotionalRegulation",
  energy_body: "functionalEnergy",
  self_trust: "decisionalClarity",
  willpower_perseverance: "executiveControl",
  optimal_weight_management: "functionalEnergy",
};

const MODULE_TO_DOMAIN: Partial<Record<OmniKunoModuleId, DomainId>> = {
  focus_clarity: "work",
  decision_discernment: "work",
  relationships_communication: "relationships",
  emotional_balance: "personal",
  energy_body: "personal",
  self_trust: "growth",
  willpower_perseverance: "growth",
  optimal_weight_management: "personal",
};

const DOMAIN_BASE: Record<DomainId, number> = {
  work: 0,
  personal: 0,
  relationships: 0,
  growth: 0,
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(10, Math.round(value)));
}

function normalizeDomainWeights(weights: Record<DomainId, number>): DomainPreference[] {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (!total) return [];
  const lastMentioned = new Date().toISOString();
  return (Object.entries(weights) as Array<[DomainId, number]>)
    .filter(([, value]) => value > 0)
    .map(([domainId, value]) => ({
      domainId,
      weight: value / total,
      lastMentioned,
    }))
    .sort((a, b) => b.weight - a.weight);
}

export function mapScoresToProfile(input: {
  dimensionScores?: DimensionScores | null;
}): { catProfilePatch: CatProfilePatch; domainWeightsPatch: DomainPreference[] } {
  const { dimensionScores } = input;
  const catProfilePatch: CatProfilePatch = {};
  const domainBuckets = { ...DOMAIN_BASE };

  if (dimensionScores) {
    (Object.entries(dimensionScores) as Array<[OmniKunoModuleId, number]>).forEach(([moduleId, value]) => {
      const axis = MODULE_TO_AXIS[moduleId];
      if (axis) {
        catProfilePatch[axis] = {
          score: clampScore(value / 10),
          confidence: value > 0 ? "low" : "unknown",
          canonDomain: MODULE_TO_CANON_DOMAIN[moduleId] ?? "executiveControl",
          lastUpdated: new Date().toISOString(),
        };
      }
      const domain = MODULE_TO_DOMAIN[moduleId];
      if (domain) {
        domainBuckets[domain] += Math.max(0, value);
      }
    });
  }

  return {
    catProfilePatch,
    domainWeightsPatch: normalizeDomainWeights(domainBuckets),
  };
}
