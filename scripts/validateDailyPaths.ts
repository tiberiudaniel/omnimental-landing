import {
  DAILY_PATHS_DEEP_RO,
  DAILY_PATHS_DEEP_EN,
  DAILY_PATHS_SHORT_RO,
  DAILY_PATHS_SHORT_EN,
  getModuleSequenceForCluster,
} from "../config/dailyPath";
import type { AdaptiveCluster, DailyPathConfig, DailyPathLanguage, DailyPathMode, DailyPathNodeConfig } from "../types/dailyPath";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function validateQuizNode(pathName: string, node: DailyPathNodeConfig) {
  assert(node.description && node.description.trim().length > 0, `${pathName}/${node.id} quiz must have a question`);
  assert(Array.isArray(node.quizOptions) && node.quizOptions.length >= 2, `${pathName}/${node.id} quiz must have at least two options`);
  assert(Array.isArray(node.correctOptionIds), `${pathName}/${node.id} quiz must define correctOptionIds`);
  assert(node.correctOptionIds.length === 1, `${pathName}/${node.id} quiz must have exactly one correct option`);

  const optionIds = new Set((node.quizOptions ?? []).map((opt) => opt.id));
  const [correctId] = node.correctOptionIds;
  assert(optionIds.has(correctId), `${pathName}/${node.id} quiz correct option "${correctId}" missing from quizOptions`);
  for (const opt of node.quizOptions ?? []) {
    assert(opt.label && opt.label.trim().length > 0, `${pathName}/${node.id} quiz option ${opt.id} must have label`);
  }
}

function validateRealWorldNode(pathName: string, node: DailyPathNodeConfig) {
  assert(node.title && node.title.trim().length > 0, `${pathName}/${node.id} REAL_WORLD node must have title`);
  assert(Array.isArray(node.fields) && node.fields.length > 0, `${pathName}/${node.id} REAL_WORLD node must define fields`);
  node.fields?.forEach((field, index) => {
    assert(field.label && field.label.trim().length > 0, `${pathName}/${node.id} REAL_WORLD field[${index}] must have a label`);
  });
}

function validateSummaryNode(pathName: string, node: DailyPathNodeConfig) {
  assert(node.title && node.title.trim().length > 0, `${pathName}/${node.id} SUMMARY node must have title`);
  assert(Array.isArray(node.bullets) && node.bullets.length > 0, `${pathName}/${node.id} SUMMARY node must define bullets`);
  assert(node.anchorDescription && node.anchorDescription.trim().length > 0, `${pathName}/${node.id} SUMMARY node must include anchorDescription`);
}

function validateGenericTextNode(pathName: string, node: DailyPathNodeConfig) {
  assert(node.title && node.title.trim().length > 0, `${pathName}/${node.id} node must have title`);
  assert(node.description && node.description.trim().length > 0, `${pathName}/${node.id} node must have description`);
}

const VALID_SHAPES = new Set(["circle", "star", "hollow"]);

function validateNodeShape(pathName: string, node: DailyPathNodeConfig) {
  assert(node.shape && VALID_SHAPES.has(node.shape), `${pathName}/${node.id} must specify a valid shape`);
}

function validatePathConfig(pathName: string, config: DailyPathConfig) {
  assert(config.nodes && config.nodes.length > 0, `${pathName} has no nodes`);

  const seenIds = new Set<string>();
  let introCount = 0;
  let summaryCount = 0;

  for (const node of config.nodes) {
    assert(!seenIds.has(node.id), `${pathName} has duplicate node id "${node.id}"`);
    seenIds.add(node.id);

    validateNodeShape(pathName, node);
    switch (node.kind) {
      case "INTRO":
        introCount += 1;
        validateGenericTextNode(pathName, node);
        break;
      case "LEARN":
        validateGenericTextNode(pathName, node);
        break;
      case "QUIZ_SINGLE":
        validateQuizNode(pathName, node);
        break;
      case "SIMULATOR":
        validateGenericTextNode(pathName, node);
        break;
      case "REAL_WORLD":
        validateRealWorldNode(pathName, node);
        break;
      case "SUMMARY":
        summaryCount += 1;
        validateSummaryNode(pathName, node);
        break;
      case "ANCHOR":
      case "ACTION":
      case "RESET":
        validateGenericTextNode(pathName, node);
        break;
      default:
        throw new Error(`${pathName}/${node.id} has unknown node kind "${node.kind}"`);
    }
  }

  assert(introCount === 1, `${pathName} must have exactly one INTRO node`);
  assert(summaryCount === 1, `${pathName} must have exactly one SUMMARY node`);
}

function compareSets(a: Set<string> | undefined, b: Set<string> | undefined): boolean {
  if (!a || !b) return false;
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

function detectMode(label: string): DailyPathMode {
  return label.includes("DEEP") ? "deep" : "short";
}

function detectLang(label: string): DailyPathLanguage {
  return label.endsWith(".en") ? "en" : "ro";
}

function main() {
  const collections: Array<[string, Record<string, DailyPathConfig[]>]> = [
    ["DAILY_PATHS_DEEP.ro", DAILY_PATHS_DEEP_RO],
    ["DAILY_PATHS_DEEP.en", DAILY_PATHS_DEEP_EN],
    ["DAILY_PATHS_SHORT.ro", DAILY_PATHS_SHORT_RO],
    ["DAILY_PATHS_SHORT.en", DAILY_PATHS_SHORT_EN],
  ];

  let hasErrors = false;
  const parityTracker: Record<string, { ro?: Set<string>; en?: Set<string> }> = {};

  for (const [label, paths] of collections) {
    const lang = detectLang(label);
    const mode = detectMode(label);
    for (const [cluster, configs] of Object.entries(paths ?? {})) {
      const moduleKeys = new Set<string>();
      const orderedKeys: string[] = [];
      for (const pathConfig of configs ?? []) {
        try {
          if (!pathConfig.moduleKey || !pathConfig.moduleKey.trim()) {
            throw new Error("moduleKey is required");
          }
          if (moduleKeys.has(pathConfig.moduleKey)) {
            throw new Error(`duplicate moduleKey "${pathConfig.moduleKey}" within ${cluster}`);
          }
          moduleKeys.add(pathConfig.moduleKey);
          orderedKeys.push(pathConfig.moduleKey);
          validatePathConfig(`${label}.${cluster}.${pathConfig.id}`, pathConfig as DailyPathConfig);
        } catch (error) {
          console.error(`[dailyPath validation] Error in ${label}.${cluster}.${pathConfig?.id ?? "unknown"}:`, (error as Error).message);
          hasErrors = true;
        }
      }

      const expectedSequence = getModuleSequenceForCluster(cluster as AdaptiveCluster);
      if (expectedSequence.length !== orderedKeys.length || expectedSequence.some((key, idx) => key !== orderedKeys[idx])) {
        console.error(
          `[dailyPath validation] Sequence mismatch for ${label}.${cluster}. Expected [${expectedSequence.join(", ")}], got [${orderedKeys.join(", ")}]`,
        );
        hasErrors = true;
      }

      const parityKey = `${cluster}:${mode}`;
      parityTracker[parityKey] = parityTracker[parityKey] ?? {};
      parityTracker[parityKey][lang] = new Set(orderedKeys);
    }
  }

  for (const [key, pair] of Object.entries(parityTracker)) {
    const { ro, en } = pair;
    if (!ro || !en) {
      console.error(`[dailyPath validation] Missing module set for ${key}. ro=${Boolean(ro)} en=${Boolean(en)}`);
      hasErrors = true;
      continue;
    }
    if (!compareSets(ro, en)) {
      console.error(
        `[dailyPath validation] EN/RO module mismatch for ${key}. ro=[${Array.from(ro).join(", ")}] en=[${Array.from(en).join(", ")}]`,
      );
      hasErrors = true;
    }
  }

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log("[dailyPath validation] All configs look valid.");
  }
}

main();
