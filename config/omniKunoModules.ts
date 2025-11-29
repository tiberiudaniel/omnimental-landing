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
  legacyKey: OmniKunoLegacyModuleKey;
  aliases?: string[];
};

export const OMNIKUNO_MODULES = [
  {
    id: "emotional_balance",
    label: { ro: "Echilibru Emoțional", en: "Emotional Balance" },
    legacyKey: "calm",
    aliases: ["calm", "balance", "emotionalbalance", "stress", "stres"],
  },
  {
    id: "focus_clarity",
    label: { ro: "Claritate & Focus", en: "Clarity & Focus" },
    legacyKey: "focus",
    aliases: ["focus", "clarity", "focusclarity"],
  },
  {
    id: "relationships_communication",
    label: { ro: "Relații & Comunicare", en: "Relationships & Communication" },
    legacyKey: "relations",
    aliases: ["relations", "relationship", "relationships", "rel", "relcomm", "communication", "boundaries"],
  },
  {
    id: "energy_body",
    label: { ro: "Energie & Corp", en: "Energy & Body" },
    legacyKey: "energy",
    aliases: ["energy", "energie", "energybody", "health", "habits", "lifestyle"],
  },
  {
    id: "self_trust",
    label: { ro: "Încredere în Sine", en: "Self-Trust" },
    legacyKey: "sense",
    aliases: ["sense", "selftrust", "confidence", "trust", "identity", "purpose", "meaning"],
  },
  {
    id: "decision_discernment",
    label: { ro: "Discernământ & Decizii", en: "Discernment & Decisions" },
    legacyKey: "performance",
    aliases: ["performance", "decision", "decisions", "discernment", "direction"],
  },
  {
    id: "willpower_perseverance",
    label: { ro: "Voință & Perseverență", en: "Willpower & Perseverance" },
    legacyKey: "willpower",
    aliases: ["willpower", "perseverance", "discipline", "resilience"],
  },
  {
    id: "optimal_weight_management",
    label: { ro: "Greutate optimă", en: "Optimal Weight" },
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

export function getLegacyModuleKeyById(id: OmniKunoModuleId): OmniKunoLegacyModuleKey | null {
  return OMNIKUNO_LEGACY_KEY_BY_ID[id] ?? null;
}
