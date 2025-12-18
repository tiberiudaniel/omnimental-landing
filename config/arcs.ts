import type { CanonDomainId, CatAxisId } from "@/lib/profileEngine";

export type ArcConfig = {
  id: string;
  name: string;
  canonDomain: CanonDomainId;
  traitPrimary: CatAxisId;
  traitSecondary: CatAxisId[];
  lengthDays: number;
  difficulty: "easy" | "medium" | "hard";
  entryRequirements: {
    minSessionsCompleted: number;
    minCatLevel?: Partial<Record<CatAxisId, number>>;
  };
  moduleIds: string[];
  description: string;
};

export const ARC_CONFIGS: ArcConfig[] = [
  {
    id: "clarity_01",
    name: "Claritate operațională",
    canonDomain: "decisionalClarity",
    traitPrimary: "clarity",
    traitSecondary: ["focus"],
    lengthDays: 7,
    difficulty: "easy",
    entryRequirements: {
      minSessionsCompleted: 0,
    },
    moduleIds: [
      "clarity_01_illusion_of_clarity",
      "clarity_02_one_real_thing",
      "clarity_03_fog_vs_fatigue",
      "clarity_04_brutal_writing",
    ],
    description: "Reduce zgomotul cognitiv și instalează regula unei singure decizii reale pe zi.",
  },
  {
    id: "energy_01",
    name: "Energie funcțională",
    canonDomain: "functionalEnergy",
    traitPrimary: "energy",
    traitSecondary: ["flexibility"],
    lengthDays: 7,
    difficulty: "easy",
    entryRequirements: {
      minSessionsCompleted: 0,
    },
    moduleIds: [
      "focus_energy_01_energy_not_motivation",
      "focus_energy_02_cognitive_fragmentation_cost",
      "focus_energy_03_entering_state_vs_forcing",
    ],
    description: "Stabilește reglajele rapide (respirație, micro-pauză, corp) ca să nu te blochezi din energie scăzută.",
  },
  {
    id: "emotional_01",
    name: "Reglare emoțională practică",
    canonDomain: "emotionalRegulation",
    traitPrimary: "emotionalStability",
    traitSecondary: ["recalibration"],
    lengthDays: 10,
    difficulty: "medium",
    entryRequirements: {
      minSessionsCompleted: 4,
    },
    moduleIds: [
      "emotional_flex_01_automatic_reaction_amygdala",
      "emotional_flex_02_facts_vs_interpretations",
      "emotional_flex_03_discomfort_tolerance",
      "emotional_flex_04_fast_emotional_reset",
      "emotional_flex_05_choice_of_response",
    ],
    description: "Îți construiești reflexul de a opri reacția automată și de a reveni la decizie funcțională.",
  },
];

export function getArcById(id: string): ArcConfig | undefined {
  return ARC_CONFIGS.find((arc) => arc.id === id);
}
