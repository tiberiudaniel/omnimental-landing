import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import Metric from "@/components/dashboard/Metric";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import type { OmniBlock } from "@/lib/omniIntel";

type OmniScopeComponents = ReturnType<typeof import("@/lib/dashboardMetrics").computeOmniScope>;

type OmniFlexComponents = ReturnType<typeof import("@/lib/dashboardMetrics").computeOmniFlex>;

type ProfileIndicesCardProps = {
  lang: string;
  debugGrid?: boolean;
  omniScopeScore: number;
  omniScopeComp: OmniScopeComponents;
  omniCunoScore: number;
  omniKunoDebugBadge?: string;
  omniKunoTooltipDynamic: string[] | null;
  omniAbilScore: number;
  omniFlexScore: number;
  omniFlexComp: OmniFlexComponents;
  omni: OmniBlock | undefined;
};

export default function ProfileIndicesCard({
  lang,
  debugGrid,
  omniScopeScore,
  omniScopeComp,
  omniCunoScore,
  omniKunoDebugBadge,
  omniKunoTooltipDynamic,
  omniAbilScore,
  omniFlexScore,
  omniFlexComp,
  omni,
}: ProfileIndicesCardProps) {
  return (
    <motion.div
      variants={fadeDelayed(0.22)}
      {...hoverScale}
      className={`order-3 md:order-3 md:col-span-2 ${debugGrid ? "outline outline-1 outline-[#C24B17]/40" : ""}`}
    >
      <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
        <h3 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">
          {lang === "ro" ? "Profile indices" : "Profile indices"}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:gap-3">
          <Metric
            label="Omni-Scop"
            value={omniScopeScore}
            tooltipItems={
              lang === "ro"
                ? [
                    `45% Motivație: ${omniScopeComp.components.motivation}%`,
                    `25% Potrivire intenție (claritate + bogăție): ${omniScopeComp.components.intent}%`,
                    `20% Pregătire/plan (note + recență): ${omniScopeComp.components.prepared}%`,
                    `5% Cunoștințe (Kuno): ${omniScopeComp.components.knowledge}%`,
                    `5% Consistență (7 zile): ${omniScopeComp.components.consistency}%`,
                  ]
                : [
                    `45% Motivation: ${omniScopeComp.components.motivation}%`,
                    `25% Intent fit (clarity + richness): ${omniScopeComp.components.intent}%`,
                    `20% Preparedness/plan (notes + recency): ${omniScopeComp.components.prepared}%`,
                    `5% Knowledge (Kuno): ${omniScopeComp.components.knowledge}%`,
                    `5% Consistency (7 days): ${omniScopeComp.components.consistency}%`,
                  ]
            }
          />
          <Metric
            label="Omni-Cuno"
            value={omniCunoScore}
            testId="metric-omni-cuno"
            testIdValue="metric-omni-cuno-value"
            debugBadge={omniKunoDebugBadge}
            tooltipItems={
              omniKunoTooltipDynamic ||
              (lang === "ro"
                ? ["70% Media ponderată (EWMA) a testelor", "25% Măiestrie pe categorii", "5% Lecții terminate"]
                : ["70% EWMA of knowledge quizzes", "25% Category mastery mean", "5% Lessons completed"])
            }
          />
          <Metric
            label="Omni-Abil"
            value={omniAbilScore}
            tooltipItems={
              lang === "ro"
                ? ["70% Media evaluărilor de abilități", "30% Practică efectivă (exerciții)"]
                : ["70% Ability assessments mean", "30% Practice signal (exercises)"]
            }
          />
          <Metric
            label="Omni-Flex"
            value={omniFlexScore}
            tooltipItems={
              lang === "ro"
                ? [
                    `25% Flex cognitiv (Kuno + bogăție intenții): ${omniFlexComp.components.cognitive}%`,
                    `25% Flex comportamental (varietate practici): ${omniFlexComp.components.behavioral}%`,
                    `25% Adaptare/actualizare plan: ${omniFlexComp.components.adaptation}%`,
                    `25% Deschidere/vointă (sprijin + potrivire): ${omniFlexComp.components.openness}%`,
                  ]
                : [
                    `25% Cognitive (mastery breadth + intent richness): ${omniFlexComp.components.cognitive}%`,
                    `25% Behavioral (variety across practices): ${omniFlexComp.components.behavioral}%`,
                    `25% Adaptation/plan recency: ${omniFlexComp.components.adaptation}%`,
                    `25% Openness (learn from others + schedule fit): ${omniFlexComp.components.openness}%`,
                  ]
            }
          />
        </div>
        {renderMasterySegments(lang, omni)}
      </Card>
    </motion.div>
  );
}

function renderMasterySegments(lang: string, omni: OmniBlock | undefined) {
  let masterySegments: Array<{ key: string; value: number }> = [];
  try {
    const mastery = (omni?.kuno as unknown as { masteryByCategory?: Record<string, number> } | undefined)?.masteryByCategory;
    const entries = mastery ? Object.entries(mastery) : [];
    masterySegments = entries
      .map(([k, v]) => ({ key: k, value: Number(v) }))
      .filter((entry) => Number.isFinite(entry.value))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  } catch {
    masterySegments = [];
  }
  if (!masterySegments.length) return null;
  const labelMap: Record<string, string> = {
    clarity: lang === "ro" ? "Claritate mentală" : "Clarity",
    calm: lang === "ro" ? "Echilibru emoțional" : "Emotional balance",
    energy: lang === "ro" ? "Energie fizică" : "Energy",
    relationships: lang === "ro" ? "Relații" : "Relationships",
    performance: lang === "ro" ? "Performanță" : "Performance",
    health: lang === "ro" ? "Sănătate" : "Health",
    general: lang === "ro" ? "General" : "General",
  };
  return (
    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3">
      {masterySegments.map(({ key, value }) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[#7B6B60]">
            <span>{labelMap[key] ?? key}</span>
            <span>{Math.round(value)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded bg-[#EFE5DA]">
            <div className="h-full bg-[#C07963]" style={{ width: `${Math.max(0, Math.min(100, Math.round(value)))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
