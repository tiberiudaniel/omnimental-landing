import type { CatAxisId } from "@/lib/profileEngine";

export type CatVocabCard = {
  id: string;
  axisId: CatAxisId;
  domainId: string;
  stateLabel: {
    ro: string;
    en: string;
  };
  command: {
    ro: string;
    en: string;
  };
  antiPattern: string;
  microAction: string;
  tokens: {
    ro: string[];
    en?: string[];
  };
  isTopCommand?: boolean;
};

const VOCAB_CARDS: CatVocabCard[] = [
  {
    id: "clarity_fog",
    axisId: "clarity",
    domainId: "decisionalClarity",
    stateLabel: { ro: "În ceață", en: "Foggy" },
    command: { ro: "Reality check.", en: "Reality check." },
    antiPattern: "inventez explicații / presupun",
    microAction: "spune 1 fapt verificabil acum",
    tokens: { ro: ["ceață", "confuz", "nu înțeleg", "neclar"] },
  },
  {
    id: "clarity_story_strip",
    axisId: "clarity",
    domainId: "decisionalClarity",
    stateLabel: { ro: "Îmi fac filme", en: "Spinning stories" },
    command: { ro: "Strip the story.", en: "Strip the story." },
    antiPattern: "narațiune → anxietate",
    microAction: "separă: fapt vs interpretare (1 linie / 1 linie)",
    tokens: { ro: ["filme", "poveste", "scenariu", "interpretare"] },
  },
  {
    id: "focus_scattered",
    axisId: "focus",
    domainId: "executiveControl",
    stateLabel: { ro: "Împrăștiată", en: "Scattered" },
    command: { ro: "Single thread.", en: "Single thread." },
    antiPattern: "3 taskuri începute, 0 terminate",
    microAction: "alege 1 lucru, închide 1 pas",
    tokens: { ro: ["împrăștiat", "nu mă pot concentra", "sar", "mă pierd"] },
  },
  {
    id: "focus_hurried",
    axisId: "focus",
    domainId: "executiveControl",
    stateLabel: { ro: "Grăbită", en: "Rushed" },
    command: { ro: "Slow the body.", en: "Slow the body." },
    antiPattern: "viteză = erori",
    microAction: "expir lung 2 ori, apoi 1 acțiune",
    tokens: { ro: ["grăbit", "pe fugă", "nu am timp", "repede"] },
  },
  {
    id: "energy_tired",
    axisId: "energy",
    domainId: "functionalEnergy",
    stateLabel: { ro: "Obosită", en: "Tired" },
    command: { ro: "Energy first.", en: "Energy first." },
    antiPattern: "decid lucruri grele pe baterie goală",
    microAction: "alege versiunea minimă (2 minute)",
    tokens: { ro: ["obosit", "rupt", "fără energie", "epuizat"] },
  },
  {
    id: "energy_live_tomorrow",
    axisId: "energy",
    domainId: "functionalEnergy",
    stateLabel: { ro: "Forțez prea mult", en: "Overpushing" },
    command: { ro: "Live to play tomorrow.", en: "Live to play tomorrow." },
    antiPattern: "încă un pas → prăbușire",
    microAction: "oprește elegant: închide bucla, notează next step",
    tokens: { ro: ["forțez", "nu mă opresc", "încă puțin", "trag de mine"] },
    isTopCommand: true,
  },
  {
    id: "emo_tense",
    axisId: "emotionalStability",
    domainId: "emotionRegulation",
    stateLabel: { ro: "Încordată", en: "Tense" },
    command: { ro: "Name the state.", en: "Name the state." },
    antiPattern: "mă contopesc cu starea",
    microAction: "spune: ‘observ tensiune/frică/iritare’",
    tokens: { ro: ["încordat", "tensionat", "stres", "iritat"] },
  },
  {
    id: "emo_watch_mind",
    axisId: "emotionalStability",
    domainId: "emotionRegulation",
    stateLabel: { ro: "Îmi sare reacția", en: "Reactive" },
    command: { ro: "Watch the mind.", en: "Watch the mind." },
    antiPattern: "impuls → acțiune imediată",
    microAction: "observ 3 secunde fără să fac nimic",
    tokens: { ro: ["mă enervez", "mă aprind", "impuls", "reacționez"] },
    isTopCommand: true,
  },
  {
    id: "emo_train_not_judge",
    axisId: "emotionalStability",
    domainId: "emotionRegulation",
    stateLabel: { ro: "Mă critic", en: "Self-judging" },
    command: { ro: "Train, not judge.", en: "Train, not judge." },
    antiPattern: "critică → blocaj",
    microAction: "1 corecție concretă, 0 insulte",
    tokens: { ro: ["mă cert", "sunt prost", "n-am fost în stare", "rușine"] },
    isTopCommand: true,
  },
  {
    id: "recal_stop_frame",
    axisId: "recalibration",
    domainId: "metacognition",
    stateLabel: { ro: "Mă ia valul", en: "Swept away" },
    command: { ro: "Stop-frame.", en: "Stop-frame." },
    antiPattern: "acționez în primul val",
    microAction: "pauză 3 secunde + 1 întrebare",
    tokens: { ro: ["val", "m-am pierdut", "mă ia", "nu gândesc"] },
    isTopCommand: true,
  },
  {
    id: "recal_change_not_failure",
    axisId: "recalibration",
    domainId: "metacognition",
    stateLabel: { ro: "Îmi e greu să schimb", en: "Resisting change" },
    command: { ro: "Change is not failure.", en: "Change is not failure." },
    antiPattern: "țin de plan ca să-mi apăr ego-ul",
    microAction: "spune: ‘update’, apoi schimbă 1 parametru",
    tokens: { ro: ["nu vreau să schimb", "țin cu dinții", "încă merge", "nu cedez"] },
    isTopCommand: true,
  },
  {
    id: "recal_pattern",
    axisId: "recalibration",
    domainId: "metacognition",
    stateLabel: { ro: "Iar sunt așa", en: "Here we go again" },
    command: { ro: "This is a pattern.", en: "This is a pattern." },
    antiPattern: "identitate → vină",
    microAction: "numește pattern-ul (2 cuvinte)",
    tokens: { ro: ["iar", "mereu", "din nou", "așa sunt eu"] },
    isTopCommand: true,
  },
  {
    id: "flex_adapt_not_defend",
    axisId: "flexibility",
    domainId: "executiveControl",
    stateLabel: { ro: "Mă încăpățânez", en: "Digging in" },
    command: { ro: "Adapt, don’t defend.", en: "Adapt, don’t defend." },
    antiPattern: "apăr strategia moartă",
    microAction: "alege: schimb / ies / simplific",
    tokens: { ro: ["încăpățânat", "nu renunț", "am dreptate", "nu schimb"] },
    isTopCommand: true,
  },
  {
    id: "flex_abort_sunk_cost",
    axisId: "flexibility",
    domainId: "executiveControl",
    stateLabel: { ro: "Mă agăț", en: "Clinging" },
    command: { ro: "Abort sunk cost.", en: "Abort sunk cost." },
    antiPattern: "am investit → continui prost",
    microAction: "oprește și salvează resursele",
    tokens: { ro: ["mă agăț", "prea târziu", "am băgat mult", "nu pot opri"] },
    isTopCommand: true,
  },
  {
    id: "conf_tiny_action_now",
    axisId: "adaptiveConfidence",
    domainId: "selfDirection",
    stateLabel: { ro: "Blocat(ă)", en: "Stuck" },
    command: { ro: "Tiny action now.", en: "Tiny action now." },
    antiPattern: "aștept să am chef / claritate perfectă",
    microAction: "alege pas de 2 minute",
    tokens: { ro: ["blocat", "nu pot începe", "mă paralizez", "amân"] },
    isTopCommand: true,
  },
  {
    id: "conf_finish_slice",
    axisId: "adaptiveConfidence",
    domainId: "selfDirection",
    stateLabel: { ro: "Încep multe", en: "Starting too much" },
    command: { ro: "Finish the slice.", en: "Finish the slice." },
    antiPattern: "deschid bucle fără închidere",
    microAction: "închide un lucru mic complet",
    tokens: { ro: ["încep multe", "nu termin", "las pe mâine", "neterminat"] },
    isTopCommand: true,
  },
];

export const CAT_VOCABULARY: Record<string, CatVocabCard> = VOCAB_CARDS.reduce(
  (acc, card) => {
    acc[card.id] = card;
    return acc;
  },
  {} as Record<string, CatVocabCard>,
);

export function getVocabByAxis(axisId: CatAxisId): CatVocabCard[] {
  return VOCAB_CARDS.filter((card) => card.axisId === axisId);
}

export function getDefaultVocabForAxis(axisId: CatAxisId): CatVocabCard {
  const cards = getVocabByAxis(axisId);
  if (cards.length > 0) return cards[0];
  return CAT_VOCABULARY.clarity_fog;
}

function hashDayKey(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickWordOfDay({
  axisId,
  unlockedIds = [],
  dayKey,
}: {
  axisId: CatAxisId | null | undefined;
  unlockedIds?: string[];
  dayKey: string;
}): CatVocabCard {
  const targetAxis = axisId ?? "clarity";
  const axisCards = getVocabByAxis(targetAxis);
  const available = axisCards.filter((card) => unlockedIds.includes(card.id));
  const pool = available.length ? available : axisCards.length ? axisCards : [CAT_VOCABULARY.clarity_fog];
  if (pool.length === 1) return pool[0];
  const index = hashDayKey(`${dayKey}:${targetAxis}:${unlockedIds.sort().join("-")}`) % pool.length;
  return pool[index];
}
