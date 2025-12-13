import type {
  AdaptiveCluster,
  DailyPathConfig,
  DailyPathLanguage,
  DailyPathMode,
} from "@/types/dailyPath";
import { ENERGY_DEEP_RO } from "./energy/deep.ro.ts";
import { ENERGY_DEEP_EN } from "./energy/deep.en.ts";
import { ENERGY_SHORT_RO } from "./energy/short.ro.ts";
import { ENERGY_SHORT_EN } from "./energy/short.en.ts";
import { ENERGY_CONGRUENCE_DEEP_RO } from "./energy/congruence/deep.ro.ts";
import { ENERGY_CONGRUENCE_DEEP_EN } from "./energy/congruence/deep.en.ts";
import { ENERGY_CONGRUENCE_SHORT_RO } from "./energy/congruence/short.ro.ts";
import { ENERGY_CONGRUENCE_SHORT_EN } from "./energy/congruence/short.en.ts";
import { CLARITY_DEEP_RO } from "./clarity/deep.ro.ts";
import { CLARITY_DEEP_EN } from "./clarity/deep.en.ts";
import { CLARITY_SHORT_RO } from "./clarity/short.ro.ts";
import { CLARITY_SHORT_EN } from "./clarity/short.en.ts";
import { CLARITY_ONE_THING_DEEP_RO } from "./clarity/one_important_thing/deep.ro.ts";
import { CLARITY_ONE_THING_DEEP_EN } from "./clarity/one_important_thing/deep.en.ts";
import { CLARITY_ONE_THING_SHORT_RO } from "./clarity/one_important_thing/short.ro.ts";
import { CLARITY_ONE_THING_SHORT_EN } from "./clarity/one_important_thing/short.en.ts";
import { EMOTIONAL_FLEX_DEEP_RO } from "./emotional_flex/deep.ro.ts";
import { EMOTIONAL_FLEX_DEEP_EN } from "./emotional_flex/deep.en.ts";
import { EMOTIONAL_FLEX_SHORT_RO } from "./emotional_flex/short.ro.ts";
import { EMOTIONAL_FLEX_SHORT_EN } from "./emotional_flex/short.en.ts";
import { EMO_FLEX_NAMING_DEEP_RO } from "./emotional_flex/naming/deep.ro.ts";
import { EMO_FLEX_NAMING_DEEP_EN } from "./emotional_flex/naming/deep.en.ts";
import { EMO_FLEX_NAMING_SHORT_RO } from "./emotional_flex/naming/short.ro.ts";
import { EMO_FLEX_NAMING_SHORT_EN } from "./emotional_flex/naming/short.en.ts";

type ClusterCollections = Record<AdaptiveCluster, DailyPathConfig[]>;
type ModuleVariantCollections = {
  deep: Record<DailyPathLanguage, DailyPathConfig>;
  short: Record<DailyPathLanguage, DailyPathConfig>;
};
const IS_DEV = process.env.NODE_ENV !== "production";

const MODULE_SEQUENCE: Record<AdaptiveCluster, string[]> = {
  focus_energy_cluster: ["energy_recovery", "energy_congruence"],
  clarity_cluster: ["clarity_single_intent", "clarity_one_important_thing"],
  emotional_flex_cluster: ["emotional_flex_pause", "emotional_flex_naming"],
};

const CLUSTER_MODULES: Record<AdaptiveCluster, Record<string, ModuleVariantCollections>> = {
  focus_energy_cluster: {
    energy_recovery: {
      deep: { ro: ENERGY_DEEP_RO, en: ENERGY_DEEP_EN },
      short: { ro: ENERGY_SHORT_RO, en: ENERGY_SHORT_EN },
    },
    energy_congruence: {
      deep: { ro: ENERGY_CONGRUENCE_DEEP_RO, en: ENERGY_CONGRUENCE_DEEP_EN },
      short: { ro: ENERGY_CONGRUENCE_SHORT_RO, en: ENERGY_CONGRUENCE_SHORT_EN },
    },
  },
  clarity_cluster: {
    clarity_single_intent: {
      deep: { ro: CLARITY_DEEP_RO, en: CLARITY_DEEP_EN },
      short: { ro: CLARITY_SHORT_RO, en: CLARITY_SHORT_EN },
    },
    clarity_one_important_thing: {
      deep: { ro: CLARITY_ONE_THING_DEEP_RO, en: CLARITY_ONE_THING_DEEP_EN },
      short: { ro: CLARITY_ONE_THING_SHORT_RO, en: CLARITY_ONE_THING_SHORT_EN },
    },
  },
  emotional_flex_cluster: {
    emotional_flex_pause: {
      deep: { ro: EMOTIONAL_FLEX_DEEP_RO, en: EMOTIONAL_FLEX_DEEP_EN },
      short: { ro: EMOTIONAL_FLEX_SHORT_RO, en: EMOTIONAL_FLEX_SHORT_EN },
    },
    emotional_flex_naming: {
      deep: { ro: EMO_FLEX_NAMING_DEEP_RO, en: EMO_FLEX_NAMING_DEEP_EN },
      short: { ro: EMO_FLEX_NAMING_SHORT_RO, en: EMO_FLEX_NAMING_SHORT_EN },
    },
  },
};

function buildCollections(mode: DailyPathMode, lang: DailyPathLanguage): ClusterCollections {
  const result = {} as ClusterCollections;
  (Object.keys(CLUSTER_MODULES) as AdaptiveCluster[]).forEach((cluster) => {
    const sequence = MODULE_SEQUENCE[cluster] ?? [];
    const moduleMap = CLUSTER_MODULES[cluster];
    result[cluster] = sequence.map((moduleKey) => {
      const entry = moduleMap[moduleKey];
      if (!entry) {
        throw new Error(`Missing module "${moduleKey}" for ${cluster}`);
      }
      const config = entry[mode]?.[lang];
      if (!config) {
        throw new Error(`Missing config for ${cluster} module=${moduleKey} mode=${mode} lang=${lang}`);
      }
      return config;
    });
  });
  return result;
}

export const DAILY_PATHS_DEEP_RO: ClusterCollections = buildCollections("deep", "ro");
export const DAILY_PATHS_DEEP_EN: ClusterCollections = buildCollections("deep", "en");
export const DAILY_PATHS_SHORT_RO: ClusterCollections = buildCollections("short", "ro");
export const DAILY_PATHS_SHORT_EN: ClusterCollections = buildCollections("short", "en");

const CONFIG_ID_TO_MODULE_KEY = new Map<string, string>();

function registerCollections(collections: ClusterCollections) {
  Object.values(collections).forEach((configs) => {
    configs.forEach((config) => {
      if (config?.moduleKey) {
        CONFIG_ID_TO_MODULE_KEY.set(config.id, config.moduleKey);
      }
    });
  });
}

registerCollections(DAILY_PATHS_DEEP_RO);
registerCollections(DAILY_PATHS_DEEP_EN);
registerCollections(DAILY_PATHS_SHORT_RO);
registerCollections(DAILY_PATHS_SHORT_EN);

function pickCollection(lang: DailyPathLanguage, mode: DailyPathMode): ClusterCollections {
  if (mode === "short") {
    return lang === "en" ? DAILY_PATHS_SHORT_EN : DAILY_PATHS_SHORT_RO;
  }
  return lang === "en" ? DAILY_PATHS_DEEP_EN : DAILY_PATHS_DEEP_RO;
}

export function getDailyPathForCluster(params: {
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  lang: DailyPathLanguage;
  moduleKey?: string | null;
}): DailyPathConfig {
  const { cluster, mode, lang, moduleKey } = params;
  const collections = pickCollection(lang, mode);
  const configs = collections[cluster];
  if (!configs || configs.length === 0) {
    throw new Error(`DailyPath config missing for ${cluster} mode=${mode} lang=${lang}`);
  }
  if (!moduleKey) {
    return configs[0];
  }
  const match = configs.find((config) => config.moduleKey === moduleKey);
  if (match) {
    return match;
  }
  if (IS_DEV) {
    console.warn(
      `[dailyPaths] moduleKey "${moduleKey}" missing for cluster=${cluster} mode=${mode} lang=${lang}. Falling back to ${configs[0]?.id ?? "first config"}.`,
    );
  }
  return configs[0];
}

export function getModuleSequenceForCluster(cluster: AdaptiveCluster): string[] {
  return MODULE_SEQUENCE[cluster] ?? [];
}

export function getDefaultModuleKey(cluster: AdaptiveCluster): string | null {
  const sequence = MODULE_SEQUENCE[cluster] ?? [];
  return sequence.length ? sequence[0] : null;
}

export function getModuleKeyForConfigId(configId: string): string | null {
  return CONFIG_ID_TO_MODULE_KEY.get(configId) ?? null;
}

export function getNextModuleKey(cluster: AdaptiveCluster, currentKey: string | null): string | null {
  const sequence = getModuleSequenceForCluster(cluster);
  if (!sequence.length) return null;
  if (!currentKey) return sequence[0];
  const index = sequence.indexOf(currentKey);
  if (index === -1) {
    return sequence[0];
  }
  const nextIndex = (index + 1) % sequence.length;
  return sequence[nextIndex];
}
