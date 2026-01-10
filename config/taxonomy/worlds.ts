import type { WorldId, WorldMeta } from "@/lib/taxonomy/types";

type WorldTaxonomy = Record<WorldId, WorldMeta>;

export const WORLDS: WorldTaxonomy = {
  INITIATION: {
    id: "INITIATION",
    title: "Initiation",
    description: "Familiarizare ghidată până când ritualul devine ușor și automat.",
    order: 1,
    availability: {
      isActive: true,
      defaultWorld: true,
      requiresEligibility: false,
    },
  },
  PERFORMING: {
    id: "PERFORMING",
    title: "Performing",
    description: "Practică și performanță cu măsurare clară și progres consistent.",
    order: 2,
    availability: {
      isActive: true,
      defaultWorld: false,
      requiresEligibility: true,
    },
  },
  MASTERING: {
    id: "MASTERING",
    title: "Mastering",
    description: "Personalizare avansată, coaching adaptiv și planuri AI.",
    order: 3,
    availability: {
      isActive: false,
      defaultWorld: false,
      requiresEligibility: true,
    },
  },
};
