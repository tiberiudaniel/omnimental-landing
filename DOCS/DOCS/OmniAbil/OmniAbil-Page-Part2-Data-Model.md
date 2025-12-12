# OmniAbil – Arhitectură de date (TS + Config)

## 1. Tipuri de bază

Fișier: `config/omniAbilConfig.ts`

- `LocalizedString` – text RO/EN.
- `OmniAbilId` – enum string pentru abilități.
- `OmniAbilMoveSlot` – tip de „mișcare” (ritual, micro reset etc).
- `OmniAbilDefinition` – metadate pentru o abilitate.
- `OmniAbilMoveDefinition` – definiție pentru o acțiune concretă („move”).

Se folosește `OmniKunoModuleId` dacă există deja în proiect (pentru legare Kuno ↔ Abil).

## 2. Config de abilități & moves

```ts
// FILE: config/omniAbilConfig.ts
import type { OmniKunoModuleId } from "@/config/omniKunoModules";

export type LocalizedString = {
  ro: string;
  en: string;
};

export type OmniAbilId =
  | "clarity_focus"
  | "energy"
  | "emotional_balance"
  | "sleep_recovery"
  | "willpower_perseverance"
  | "optimal_weight_management"
  | "relationships"
  | "trading_psychology";

export type OmniAbilMoveSlot =
  | "daily_ritual"
  | "micro_reset"
  | "skill_booster"
  | "emergency";

export type OmniAbilDefinition = {
  id: OmniAbilId;
  icon: string;
  title: LocalizedString;
  oneLiner: LocalizedString;
  moduleId?: OmniKunoModuleId;
  arcId?: string; // id din omniArcs.ts (opțional)
};

export type OmniAbilMoveDefinition = {
  id: string;
  abilityId: OmniAbilId;
  slot: OmniAbilMoveSlot;
  title: LocalizedString;
  description: LocalizedString;
  xpReward: number;
  durationSeconds?: number;
};

export const OMNI_ABILITIES: OmniAbilDefinition[] = [
  {
    id: "clarity_focus",
    icon: "🎯",
    title: {
      ro: "Claritate & Focus",
      en: "Clarity & Focus",
    },
    oneLiner: {
      ro: "Îți antrenezi atenția în sprinturi scurte și reduci zgomotul mental.",
      en: "Train your attention in short sprints and reduce mental noise.",
    },
    moduleId: "clarity_focus" as OmniKunoModuleId,
    arcId: "claritate-energie",
  },
  {
    id: "energy",
    icon: "⚡",
    title: {
      ro: "Energie stabilă",
      en: "Stable energy",
    },
    oneLiner: {
      ro: "Îți calibrezi energia zilnică fără să te epuizezi.",
      en: "Calibrate daily energy without burning out.",
    },
    moduleId: "energy_balance" as OmniKunoModuleId,
    arcId: "claritate-energie",
  },
  {
    id: "emotional_balance",
    icon: "🌊",
    title: {
      ro: "Echilibru emoțional",
      en: "Emotional balance",
    },
    oneLiner: {
      ro: "Îți reglezi reacțiile și reduci inerția emoțională.",
      en: "Regulate reactions and reduce emotional inertia.",
    },
    moduleId: "emotional_resilience" as OmniKunoModuleId,
    arcId: "claritate-energie",
  },
  {
    id: "sleep_recovery",
    icon: "🌙",
    title: {
      ro: "Somn & Recuperare",
      en: "Sleep & recovery",
    },
    oneLiner: {
      ro: "Folosești somnul ca multiplicator de progres, nu ca pauză haotică.",
      en: "Use sleep as a progress multiplier, not a random shutdown.",
    },
    moduleId: "sleep_recovery" as OmniKunoModuleId,
    arcId: "claritate-energie",
  },
  {
    id: "willpower_perseverance",
    icon: "🛡️",
    title: {
      ro: "Voință & Perseverență",
      en: "Willpower & perseverance",
    },
    oneLiner: {
      ro: "Construiești disciplină prin pași mici, repetabili.",
      en: "Build discipline through small repeatable steps.",
    },
    moduleId: "willpower_perseverance" as OmniKunoModuleId,
    arcId: "claritate-energie",
  },
  {
    id: "optimal_weight_management",
    icon: "🥗",
    title: {
      ro: "Greutate optimă",
      en: "Optimal weight",
    },
    oneLiner: {
      ro: "Reglezi alimentația fără extreme și vinovăție.",
      en: "Adjust nutrition without extremes or guilt.",
    },
    moduleId: "optimal_weight_management" as OmniKunoModuleId,
    arcId: "claritate-energie",
  },
  {
    id: "relationships",
    icon: "🤝",
    title: {
      ro: "Relații & Conectare",
      en: "Relationships & connection",
    },
    oneLiner: {
      ro: "Construiești interacțiuni mai calme, mai clare, mai oneste.",
      en: "Build calmer, clearer, more honest interactions.",
    },
    moduleId: "relationships" as OmniKunoModuleId,
    arcId: "claritate-energie",
  },
  {
    id: "trading_psychology",
    icon: "📈",
    title: {
      ro: "Psihologia Trading-ului",
      en: "Trading psychology",
    },
    oneLiner: {
      ro: "Îți antrenezi comportamentul în piață, nu doar strategiile.",
      en: "Train your behavior in the market, not just strategies.",
    },
    moduleId: "trading_psychology" as OmniKunoModuleId,
    arcId: "claritate-energie",
  },
];

export const OMNI_ABIL_MOVES: OmniAbilMoveDefinition[] = [
  // Clarity & Focus
  {
    id: "clarity_focus_daily_ritual",
    abilityId: "clarity_focus",
    slot: "daily_ritual",
    title: {
      ro: "Sprint de focus (10 minute)",
      en: "Focus sprint (10 minutes)",
    },
    description: {
      ro: "Alege un singur task important și lucrează 10 minute fără întreruperi, cu notificările oprite.",
      en: "Pick one important task and work 10 minutes with notifications off.",
    },
    xpReward: 15,
    durationSeconds: 600,
  },
  {
    id: "clarity_focus_micro_reset",
    abilityId: "clarity_focus",
    slot: "micro_reset",
    title: {
      ro: "Reset 90 secunde",
      en: "90-second reset",
    },
    description: {
      ro: "Oprește tot pentru 90 secunde și urmărește doar respirația (4-4-6).",
      en: "Pause for 90 seconds and follow your breath (4-4-6).",
    },
    xpReward: 8,
    durationSeconds: 90,
  },
  {
    id: "clarity_focus_skill_booster",
    abilityId: "clarity_focus",
    slot: "skill_booster",
    title: {
      ro: "Checkpoint mental",
      en: "Mental checkpoint",
    },
    description: {
      ro: "Scrie: „Ce fac acum?” și „Care e următorul pas mic, clar?”",
      en: "Write: “What am I doing now?” and “What is the next small clear step?”",
    },
    xpReward: 10,
  },
  {
    id: "clarity_focus_emergency",
    abilityId: "clarity_focus",
    slot: "emergency",
    title: {
      ro: "Decuplare de zgomot",
      en: "Noise decoupling",
    },
    description: {
      ro: "Când ești copleșit, scoate telefonul fizic din cameră pentru 5 minute.",
      en: "When overwhelmed, move your phone out of the room for 5 minutes.",
    },
    xpReward: 12,
    durationSeconds: 300,
  },

  // Energy
  {
    id: "energy_daily_ritual",
    abilityId: "energy",
    slot: "daily_ritual",
    title: {
      ro: "Plimbare de 12 minute",
      en: "12-minute walk",
    },
    description: {
      ro: "Plimbare scurtă, fără telefon, la un pas ușor alert.",
      en: "Short, phone-free walk at a comfortable brisk pace.",
    },
    xpReward: 15,
    durationSeconds: 720,
  },
  {
    id: "energy_micro_reset",
    abilityId: "energy",
    slot: "micro_reset",
    title: {
      ro: "Respirație de reactivare",
      en: "Reactivation breath",
    },
    description: {
      ro: "3 cicluri de inspirație profundă + expirație prelungită.",
      en: "3 cycles of deep inhale + long exhale.",
    },
    xpReward: 6,
    durationSeconds: 45,
  },
  {
    id: "energy_skill_booster",
    abilityId: "energy",
    slot: "skill_booster",
    title: {
      ro: "Scan de energie (3×/zi)",
      en: "Energy scan (3×/day)",
    },
    description: {
      ro: "Notează de 3 ori pe zi energia pe o scară 1–5 (dimineață, prânz, seară).",
      en: "Log your energy 3 times a day on a 1–5 scale (morning, noon, evening).",
    },
    xpReward: 10,
  },
  {
    id: "energy_emergency",
    abilityId: "energy",
    slot: "emergency",
    title: {
      ro: "Mini reset post-scroll",
      en: "Post-scroll mini reset",
    },
    description: {
      ro: "După un scroll lung, ridică-te și fă 10 mișcări simple (întinderi / genuflexiuni).",
      en: "After long scrolling, stand up and do 10 simple movements (stretches / squats).",
    },
    xpReward: 12,
  },

  // Extindere ulterioară:
  // emotional_balance, sleep_recovery, willpower_perseverance,
  // optimal_weight_management, relationships, trading_psychology.
];

export function getMovesForAbility(abilityId: OmniAbilId): OmniAbilMoveDefinition[] {
  return OMNI_ABIL_MOVES.filter((move) => move.abilityId === abilityId);
}

export function getAbilityById(id: OmniAbilId): OmniAbilDefinition | undefined {
  return OMNI_ABILITIES.find((a) => a.id === id);
}

Engine simplu pentru UI
// FILE: lib/omniAbilEngine.ts
import type {
  OmniAbilId,
  OmniAbilDefinition,
  OmniAbilMoveDefinition,
} from "@/config/omniAbilConfig";
import { OMNI_ABILITIES, getMovesForAbility } from "@/config/omniAbilConfig";

export type UserAbilityConfig = {
  activeAbilityIds: OmniAbilId[];
};

export type OmniAbilAbilityWithMoves = {
  ability: OmniAbilDefinition;
  moves: OmniAbilMoveDefinition[];
};

export function getDefaultUserAbilityConfig(): UserAbilityConfig {
  // v1: toate abilitățile sunt considerate „active”
  return {
    activeAbilityIds: OMNI_ABILITIES.map((a) => a.id),
  };
}

export function getUserAbilitiesWithMoves(
  config?: UserAbilityConfig,
): OmniAbilAbilityWithMoves[] {
  const effectiveConfig = config ?? getDefaultUserAbilityConfig();
  return effectiveConfig.activeAbilityIds
    .map((id) => {
      const ability = OMNI_ABILITIES.find((a) => a.id === id);
      if (!ability) return null;
      const moves = getMovesForAbility(id);
      return { ability, moves };
    })
    .filter((entry): entry is OmniAbilAbilityWithMoves => Boolean(entry));
}

