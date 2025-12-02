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
  arcId?: string; // id din OMNI_ARCS (ex.: "claritate-energie")
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

/**
 * Abilități de top – mapate pe modulele OmniKuno existente
 */
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
    moduleId: "focus_clarity" as OmniKunoModuleId,
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
    moduleId: "energy_body" as OmniKunoModuleId,
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
    moduleId: "emotional_balance" as OmniKunoModuleId,
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
      ro: "Folosești somnul ca multiplicator de progres, nu ca reset haotic.",
      en: "Use sleep as a progress multiplier, not a random shutdown.",
    },
    // Somnul este integrat în energy_body în Kuno
    moduleId: "energy_body" as OmniKunoModuleId,
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
      ro: "Construiești disciplină calmă prin pași mici, repetabili.",
      en: "Build calm discipline through small, repeatable steps.",
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
      ro: "Reglezi alimentația și relația cu mâncarea fără extreme.",
      en: "Adjust nutrition and your relationship with food without extremes.",
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
    moduleId: "relationships_communication" as OmniKunoModuleId,
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
    // Poți crea ulterior un modul dedicat Kuno; pentru moment, îl poți mapa la focus/decizii
    moduleId: "decision_discernment" as OmniKunoModuleId,
    arcId: "claritate-energie",
  },
];

/**
 * Moveset complet – 8 abilități × 4 mișcări
 * Toate mișcările sunt gândite în interval 90 sec – 10 min, fără extreme.
 */
export const OMNI_ABIL_MOVES: OmniAbilMoveDefinition[] = [
  // 1) CLARITY & FOCUS
  {
    id: "clarity_focus_daily_ritual",
    abilityId: "clarity_focus",
    slot: "daily_ritual",
    title: {
      ro: "Sprint de focus (10 min)",
      en: "Focus sprint (10 min)",
    },
    description: {
      ro: "Alege un singur task important și lucrează 10 minute fără întreruperi, cu notificările oprite.",
      en: "Pick one important task and work for 10 minutes with all notifications off.",
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
      ro: "Oprește tot pentru 90 de secunde și urmărește doar respirația (4-4-6).",
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
      en: "When overwhelmed, physically move your phone out of the room for 5 minutes.",
    },
    xpReward: 12,
    durationSeconds: 300,
  },

  // 2) ENERGY
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

  // 3) EMOTIONAL BALANCE
  {
    id: "emotional_balance_daily_ritual",
    abilityId: "emotional_balance",
    slot: "daily_ritual",
    title: {
      ro: "Jurnal de emoții (3 rânduri)",
      en: "3-line emotion journal",
    },
    description: {
      ro: "Scrie în fiecare zi 3 rânduri: „Ce simt?”, „Unde simt în corp?”, „Ce am nevoie acum?”",
      en: "Write daily: “What do I feel?”, “Where in the body?”, “What do I need now?”",
    },
    xpReward: 15,
    durationSeconds: 240,
  },
  {
    id: "emotional_balance_micro_reset",
    abilityId: "emotional_balance",
    slot: "micro_reset",
    title: {
      ro: "Expir prelungit",
      en: "Long exhale",
    },
    description: {
      ro: "1 minut de inspirație normală și expirație ușor mai lungă (4–6 secunde).",
      en: "1 minute of normal inhale and slightly longer exhale (4–6 seconds).",
    },
    xpReward: 6,
    durationSeconds: 60,
  },
  {
    id: "emotional_balance_skill_booster",
    abilityId: "emotional_balance",
    slot: "skill_booster",
    title: {
      ro: "Denumește emoția",
      en: "Name the emotion",
    },
    description: {
      ro: "După o situație intensă, notează: „Numele emoției + intensitatea 1–10”.",
      en: "After an intense moment, log: “emotion name + intensity 1–10”.",
    },
    xpReward: 10,
  },
  {
    id: "emotional_balance_emergency",
    abilityId: "emotional_balance",
    slot: "emergency",
    title: {
      ro: "Ancorare 5–4–3–2–1",
      en: "5–4–3–2–1 grounding",
    },
    description: {
      ro: "Spune în gând: 5 lucruri pe care le vezi, 4 pe care le atingi, 3 pe care le auzi, 2 pe care le miroși, 1 pe care o guști.",
      en: "Mentally list: 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.",
    },
    xpReward: 14,
    durationSeconds: 180,
  },

  // 4) SLEEP & RECOVERY
  {
    id: "sleep_recovery_daily_ritual",
    abilityId: "sleep_recovery",
    slot: "daily_ritual",
    title: {
      ro: "20 min fără ecrane înainte de somn",
      en: "20 min screen-free before sleep",
    },
    description: {
      ro: "Alege o singură seară și înlocuiește ultimile 20 de minute de ecran cu ceva liniștit (citit, întinderi, jurnal).",
      en: "Pick one evening and replace the last 20 screen minutes with calm activity (reading, stretching, journaling).",
    },
    xpReward: 18,
    durationSeconds: 1200,
  },
  {
    id: "sleep_recovery_micro_reset",
    abilityId: "sleep_recovery",
    slot: "micro_reset",
    title: {
      ro: "Pauză de ochi (2 min)",
      en: "Eye reset (2 min)",
    },
    description: {
      ro: "2 minute cu ochii închiși sau privirea în depărtare, fără ecran.",
      en: "2 minutes with eyes closed or gaze far away, no screen.",
    },
    xpReward: 6,
    durationSeconds: 120,
  },
  {
    id: "sleep_recovery_skill_booster",
    abilityId: "sleep_recovery",
    slot: "skill_booster",
    title: {
      ro: "Planifică „fereastra de somn”",
      en: "Plan your sleep window",
    },
    description: {
      ro: "Alege un interval aproximativ de somn (ex.: 23:30–07:00) și notează-l pentru seara respectivă.",
      en: "Pick an approximate sleep window (e.g. 23:30–07:00) and note it down for tonight.",
    },
    xpReward: 10,
  },
  {
    id: "sleep_recovery_emergency",
    abilityId: "sleep_recovery",
    slot: "emergency",
    title: {
      ro: "Reset când mintea nu tace",
      en: "Overthinking reset",
    },
    description: {
      ro: "Dacă nu poți adormi, scrie timp de 3 minute toate gândurile pe o foaie și pune foaia deoparte.",
      en: "If you can’t sleep, write all thoughts on paper for 3 minutes and put the sheet away.",
    },
    xpReward: 14,
    durationSeconds: 180,
  },

  // 5) WILLPOWER & PERSEVERANCE
  {
    id: "willpower_perseverance_daily_ritual",
    abilityId: "willpower_perseverance",
    slot: "daily_ritual",
    title: {
      ro: "5 minute de „task greu, dar mic”",
      en: "5-minute hard-but-small task",
    },
    description: {
      ro: "Alege un mic task pe care tot îl amâni și lucrează doar 5 minute pe ce e mai simplu de început.",
      en: "Pick a small task you keep postponing and work 5 minutes on the easiest entry point.",
    },
    xpReward: 18,
    durationSeconds: 300,
  },
  {
    id: "willpower_perseverance_micro_reset",
    abilityId: "willpower_perseverance",
    slot: "micro_reset",
    title: {
      ro: "Valul de impuls (90 sec)",
      en: "Urge wave (90 sec)",
    },
    description: {
      ro: "Când vrei să abandonezi sau să cedezi unui impuls, amână 90 secunde și observă cum scade intensitatea.",
      en: "When you want to quit or act on an impulse, delay 90 seconds and watch the urge shift.",
    },
    xpReward: 8,
    durationSeconds: 90,
  },
  {
    id: "willpower_perseverance_skill_booster",
    abilityId: "willpower_perseverance",
    slot: "skill_booster",
    title: {
      ro: "Promisiune foarte mică",
      en: "Tiny promise",
    },
    description: {
      ro: "Scrie o promisiune ridicol de mică pentru azi (ex.: „deschid documentul”) și respect-o.",
      en: "Write a ridiculously small promise for today (e.g. “open the document”) and keep it.",
    },
    xpReward: 12,
  },
  {
    id: "willpower_perseverance_emergency",
    abilityId: "willpower_perseverance",
    slot: "emergency",
    title: {
      ro: "Buton de pauză (5 min)",
      en: "5-minute pause button",
    },
    description: {
      ro: "Înainte să abandonezi complet, ia 5 minute pauză și decide abia după aceea dacă lași totul baltă.",
      en: "Before you fully quit, take a 5-minute pause, then decide if you still want to drop it.",
    },
    xpReward: 14,
    durationSeconds: 300,
  },

  // 6) OPTIMAL WEIGHT MANAGEMENT
  {
    id: "optimal_weight_management_daily_ritual",
    abilityId: "optimal_weight_management",
    slot: "daily_ritual",
    title: {
      ro: "O masă conștientă",
      en: "One mindful meal",
    },
    description: {
      ro: "Alege o masă pe zi fără ecrane, mănâncă mai încet și observă gustul, mirosul, textura.",
      en: "Pick one daily meal with no screens, eat slower and notice taste, smell, texture.",
    },
    xpReward: 18,
    durationSeconds: 900,
  },
  {
    id: "optimal_weight_management_micro_reset",
    abilityId: "optimal_weight_management",
    slot: "micro_reset",
    title: {
      ro: "Pauză de 60 sec înainte de gustare",
      en: "60-second pause before snack",
    },
    description: {
      ro: "Înainte de o gustare impulsivă, oprește-te 60 de secunde și bea un pahar cu apă.",
      en: "Before an impulsive snack, pause for 60 seconds and drink a glass of water.",
    },
    xpReward: 8,
    durationSeconds: 60,
  },
  {
    id: "optimal_weight_management_skill_booster",
    abilityId: "optimal_weight_management",
    slot: "skill_booster",
    title: {
      ro: "O singură schimbare mică",
      en: "One small swap",
    },
    description: {
      ro: "Alege un singur schimb mic pentru azi (ex.: o băutură fără zahăr în loc de una cu zahăr).",
      en: "Pick one tiny swap for today (e.g. no-sugar drink instead of a sugary one).",
    },
    xpReward: 12,
  },
  {
    id: "optimal_weight_management_emergency",
    abilityId: "optimal_weight_management",
    slot: "emergency",
    title: {
      ro: "Reset fără vinovăție",
      en: "No-guilt reset",
    },
    description: {
      ro: "Dacă ai mâncat mai mult decât ai vrut, fă 5–10 minute de mers sau întinderi, fără monolog de vinovăție.",
      en: "If you overeat, do 5–10 minutes of walking or stretching without guilt monologue.",
    },
    xpReward: 14,
    durationSeconds: 420,
  },

  // 7) RELATIONSHIPS & CONNECTION
  {
    id: "relationships_daily_ritual",
    abilityId: "relationships",
    slot: "daily_ritual",
    title: {
      ro: "Mesaj de apreciere",
      en: "Appreciation message",
    },
    description: {
      ro: "Trimite un mesaj scurt de apreciere autentică cuiva (nu trebuie să fie profund, doar sincer).",
      en: "Send a short, genuine message of appreciation to someone (simple and honest).",
    },
    xpReward: 15,
    durationSeconds: 180,
  },
  {
    id: "relationships_micro_reset",
    abilityId: "relationships",
    slot: "micro_reset",
    title: {
      ro: "3 respirații înainte de răspuns",
      en: "3 breaths before reply",
    },
    description: {
      ro: "Într-o conversație tensionată, inspiră și expiră de 3 ori calm înainte să răspunzi.",
      en: "In a tense conversation, take 3 calm breaths before replying.",
    },
    xpReward: 8,
    durationSeconds: 45,
  },
  {
    id: "relationships_skill_booster",
    abilityId: "relationships",
    slot: "skill_booster",
    title: {
      ro: "Ascultare reflectivă (o frază)",
      en: "Reflective listening (one line)",
    },
    description: {
      ro: "Într-o discuție importantă, reformulează într-o frază ce ai înțeles: „Ce aud este că...”",
      en: "In an important talk, reflect in one line what you heard: “What I’m hearing is…”",
    },
    xpReward: 12,
  },
  {
    id: "relationships_emergency",
    abilityId: "relationships",
    slot: "emergency",
    title: {
      ro: "Pauză de de-escaladare",
      en: "De-escalation pause",
    },
    description: {
      ro: "Când simți că urmează să izbucnești, spune: „Am nevoie de 5 minute pauză, revin” și ieși din cameră.",
      en: "When you’re about to blow up, say: “I need a 5-minute break, I’ll come back,” and step away.",
    },
    xpReward: 14,
    durationSeconds: 300,
  },

  // 8) TRADING PSYCHOLOGY
  {
    id: "trading_psychology_daily_ritual",
    abilityId: "trading_psychology",
    slot: "daily_ritual",
    title: {
      ro: "Plan 3-linii pre-market",
      en: "3-line pre-market plan",
    },
    description: {
      ro: "Înainte de sesiune, notează: contextul pieței, scenariul principal și riscul maxim pe zi.",
      en: "Before the session, write: market context, main scenario, and max risk for the day.",
    },
    xpReward: 18,
    durationSeconds: 300,
  },
  {
    id: "trading_psychology_micro_reset",
    abilityId: "trading_psychology",
    slot: "micro_reset",
    title: {
      ro: "10 respirații înainte de buton",
      en: "10 breaths before button",
    },
    description: {
      ro: "Înainte de un buton important (Buy/Sell), ia 10 respirații calme și recitește planul.",
      en: "Before a big Buy/Sell button, take 10 calm breaths and re-read your plan.",
    },
    xpReward: 8,
    durationSeconds: 120,
  },
  {
    id: "trading_psychology_skill_booster",
    abilityId: "trading_psychology",
    slot: "skill_booster",
    title: {
      ro: "Review de 2 minute pentru o tranzacție",
      en: "2-minute trade review",
    },
    description: {
      ro: "Alege o singură tranzacție și notează: „Ce am făcut bine?”, „Ce a fost impuls?”, „Ce ajustez mâine?”.",
      en: "Pick one trade and write: “What did I do well?”, “What was impulsive?”, “What will I adjust tomorrow?”.",
    },
    xpReward: 12,
    durationSeconds: 120,
  },
  {
    id: "trading_psychology_emergency",
    abilityId: "trading_psychology",
    slot: "emergency",
    title: {
      ro: "Circuit breaker personal",
      en: "Personal circuit breaker",
    },
    description: {
      ro: "După 2 tranzacții consecutive făcute impulsiv, oprește trading-ul pentru minimum 15 minute și ieși din fața ecranului.",
      en: "After 2 back-to-back impulsive trades, stop trading for at least 15 minutes and leave the screen.",
    },
    xpReward: 20,
    durationSeconds: 900,
  },
];

export function getMovesForAbility(abilityId: OmniAbilId): OmniAbilMoveDefinition[] {
  return OMNI_ABIL_MOVES.filter((move) => move.abilityId === abilityId);
}

export function getAbilityById(id: OmniAbilId): OmniAbilDefinition | undefined {
  return OMNI_ABILITIES.find((a) => a.id === id);
}
