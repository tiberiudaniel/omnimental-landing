/**
 * Collectible cards that unlock as users advance through OmniKuno lessons.
 * Each collectible is tied to an Arc and unlocks after specific lessons finish.
 */
export type OmniCollectible = {
  id: string;
  arcId: string;
  title: string;
  shortDescription: string;
  imageUrl?: string;
  unlockAfterLessonIds: string[];
};

export const OMNI_COLLECTIBLES: OmniCollectible[] = [
  {
    id: "protocol-respiratie-4-4-6",
    arcId: "claritate-energie",
    title: "Protocol Respirație 4-4-6",
    shortDescription: "Reset rapid de calm și energie în 2 minute.",
    unlockAfterLessonIds: ["emotional_balance_l1_03_body_scan", "energy_body_l1_02_breath"],
  },
  {
    id: "regula-3-checkpoints",
    arcId: "claritate-energie",
    title: "Regula celor 3 checkpoint-uri",
    shortDescription: "Trei scanări scurte pe zi pentru claritate emoțională.",
    unlockAfterLessonIds: ["emotional_balance_l1_02_triggers", "emotional_balance_l1_04_micro_choices"],
  },
  {
    id: "jurnal-2-minute",
    arcId: "claritate-energie",
    title: "Jurnalul de 2 minute",
    shortDescription: "Format minimalist pentru a fixa insight-urile serii.",
    unlockAfterLessonIds: ["emotional_balance_l1_07_evening_reset", "emotional_balance_l1_08_micro_commit"],
  },
  {
    id: "protectie-somn-30min",
    arcId: "claritate-energie",
    title: "Ritual Protecție Somn",
    shortDescription: "30 de minute fără ecrane înainte de somn pentru reset energetic.",
    unlockAfterLessonIds: ["energy_body_protocol", "energy_body_l1_01_signals"],
  },
  {
    id: "pauza-energie-90sec",
    arcId: "claritate-energie",
    title: "Pauza de energie 90s",
    shortDescription: "Micro-reset combinat: respirație, poziție, intenție.",
    unlockAfterLessonIds: ["energy_body_l1_02_breath", "energy_body_l1_01_signals"],
  },
];
