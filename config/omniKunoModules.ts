export type OmniKunoLegacyModuleKey =
  | "calm"
  | "focus"
  | "relations"
  | "energy"
  | "performance"
  | "sense"
  | "willpower"
  | "weight";

type ModuleMeta = {
  id: string;
  label: { ro: string; en: string };
  summary?: { ro: string; en: string };
  legacyKey: OmniKunoLegacyModuleKey;
  aliases?: string[];
};

export const OMNIKUNO_MODULES = [
  {
    id: "emotional_balance",
    label: { ro: "Echilibru Emoțional", en: "Emotional Balance" },
    summary: {
      ro: "Stabilești reacțiile emoționale și înveți reglaje rapide pentru sistemul nervos.",
      en: "Stabilise emotional responses and learn fast nervous-system resets.",
    },
    legacyKey: "calm",
    aliases: ["calm", "balance", "emotionalbalance", "stress", "stres"],
  },
  {
    id: "focus_clarity",
    label: { ro: "Claritate & Focus", en: "Clarity & Focus" },
    summary: {
      ro: "Îți clarifici direcția și îți antrenezi atenția să rămână pe ce contează.",
      en: "Clarify your direction and train focus to stay on what matters.",
    },
    legacyKey: "focus",
    aliases: ["focus", "clarity", "focusclarity"],
  },
  {
    id: "relationships_communication",
    label: { ro: "Relații & Comunicare", en: "Relationships & Communication" },
    summary: {
      ro: "Rescrii tiparele de relaționare și comunici ferm fără să escaladezi conflictul.",
      en: "Rewrite relationship patterns and communicate clearly without escalating conflict.",
    },
    legacyKey: "relations",
    aliases: ["relations", "relationship", "relationships", "rel", "relcomm", "communication", "boundaries"],
  },
  {
    id: "energy_body",
    label: { ro: "Energie & Corp", en: "Energy & Body" },
    summary: {
      ro: "Refaci energia de bază prin somn, respirație și mișcare ancorată în corp.",
      en: "Rebuild baseline energy through sleep, breath and grounded movement.",
    },
    legacyKey: "energy",
    aliases: ["energy", "energie", "energybody", "health", "habits", "lifestyle"],
  },
  {
    id: "self_trust",
    label: { ro: "Încredere în Sine", en: "Self-Trust" },
    summary: {
      ro: "Îți întărești identitatea, vocea interioară și încrederea în propriile decizii.",
      en: "Strengthen identity, inner voice and trust in your own decisions.",
    },
    legacyKey: "sense",
    aliases: ["sense", "selftrust", "confidence", "trust", "identity", "purpose", "meaning"],
  },
  {
    id: "decision_discernment",
    label: { ro: "Discernământ & Decizii", en: "Discernment & Decisions" },
    summary: {
      ro: "Construiești procese lucide pentru decizii complexe și execuție fără haos.",
      en: "Build lucid processes for complex decisions and calm execution.",
    },
    legacyKey: "performance",
    aliases: ["performance", "decision", "decisions", "discernment", "direction"],
  },
  {
    id: "willpower_perseverance",
    label: { ro: "Voință & Perseverență", en: "Willpower & Perseverance" },
    summary: {
      ro: "Antrenezi perseverența calmă și obiceiuri care rezistă când energia scade.",
      en: "Train calm perseverance and habits that stay steady even when energy dips.",
    },
    legacyKey: "willpower",
    aliases: ["willpower", "perseverance", "discipline", "resilience"],
  },
  {
    id: "optimal_weight_management",
    label: { ro: "Greutate optimă", en: "Optimal Weight" },
    summary: {
      ro: "Stabilizează-ți greutatea prin pași mici, obiceiuri și echilibru minte–corp.",
      en: "Stabilise your weight through small steps, habits, and mind–body balance.",
    },
    legacyKey: "weight",
    aliases: [
      "optimalweight",
      "weight",
      "weightmanagement",
      "greutate",
      "greutateoptima",
      "alimentatie",
      "nutrition",
      "optimal_weight_management",
    ],
  },
] as const satisfies readonly ModuleMeta[];

export type OmniKunoModuleId = (typeof OMNIKUNO_MODULES)[number]["id"];
export type OmniAreaKey = OmniKunoModuleId;
export const OMNIKUNO_MODULE_IDS: readonly OmniKunoModuleId[] = OMNIKUNO_MODULES.map(
  (meta) => meta.id as OmniKunoModuleId,
);

const MODULE_BY_ID: Record<OmniKunoModuleId, ModuleMeta> = OMNIKUNO_MODULES.reduce(
  (acc, meta) => {
    acc[meta.id] = meta;
    return acc;
  },
  {} as Record<OmniKunoModuleId, ModuleMeta>,
);

export const OMNIKUNO_MODULE_LABELS: Record<OmniKunoModuleId, { ro: string; en: string }> = Object.fromEntries(
  OMNIKUNO_MODULES.map((meta) => [meta.id, meta.label]),
) as Record<OmniKunoModuleId, { ro: string; en: string }>;

export const OMNIKUNO_LEGACY_KEY_BY_ID: Record<OmniKunoModuleId, OmniKunoLegacyModuleKey> = Object.fromEntries(
  OMNIKUNO_MODULES.map((meta) => [meta.id, meta.legacyKey]),
) as Record<OmniKunoModuleId, OmniKunoLegacyModuleKey>;

const aliasPairs: Array<[string, OmniKunoModuleId]> = [];
OMNIKUNO_MODULES.forEach((meta) => {
  aliasPairs.push([meta.id, meta.id]);
  aliasPairs.push([meta.legacyKey, meta.id]);
  meta.aliases?.forEach((alias) => aliasPairs.push([alias, meta.id]));
});

export const OMNIKUNO_MODULE_ID_BY_ALIAS: Record<string, OmniKunoModuleId> = aliasPairs.reduce(
  (acc, [alias, id]) => {
    const key = alias.replace(/[^a-z0-9_]/gi, "").toLowerCase();
    if (key) acc[key] = id;
    return acc;
  },
  {} as Record<string, OmniKunoModuleId>,
);

export function resolveModuleId(value?: string | null): OmniKunoModuleId | null {
  if (!value) return null;
  const key = value.replace(/[^a-z0-9_]/gi, "").toLowerCase();
  return OMNIKUNO_MODULE_ID_BY_ALIAS[key] ?? null;
}

export function getModuleLabel(id: OmniKunoModuleId, lang: "ro" | "en" = "ro"): string {
  return MODULE_BY_ID[id]?.label?.[lang] ?? MODULE_BY_ID[id]?.label?.ro ?? id;
}

export function getModuleSummary(id: OmniKunoModuleId, lang: "ro" | "en" = "ro"): string {
  const meta = MODULE_BY_ID[id];
  if (!meta?.summary) {
    return lang === "ro"
      ? "Tema prioritară în care îți antrenezi atenția acum."
      : "Priority mission you are focusing on right now.";
  }
  return meta.summary[lang] ?? meta.summary.ro;
}

export function getLegacyModuleKeyById(id: OmniKunoModuleId): OmniKunoLegacyModuleKey | null {
  return OMNIKUNO_LEGACY_KEY_BY_ID[id] ?? null;
}
