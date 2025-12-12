import {
  DAILY_PATHS_DEEP_RO,
  DAILY_PATHS_DEEP_EN,
  DAILY_PATHS_SHORT_RO,
  DAILY_PATHS_SHORT_EN,
} from "../config/dailyPaths";
import type { DailyPathConfig, DailyPathNodeConfig } from "../types/dailyPath";

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

function validatePathConfig(pathName: string, config: DailyPathConfig) {
  assert(config.nodes && config.nodes.length > 0, `${pathName} has no nodes`);

  const seenIds = new Set<string>();
  let introCount = 0;
  let summaryCount = 0;

  for (const node of config.nodes) {
    assert(!seenIds.has(node.id), `${pathName} has duplicate node id "${node.id}"`);
    seenIds.add(node.id);

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

function main() {
  const collections: Array<[string, Record<string, DailyPathConfig>]> = [
    ["DAILY_PATHS_DEEP.ro", DAILY_PATHS_DEEP_RO],
    ["DAILY_PATHS_DEEP.en", DAILY_PATHS_DEEP_EN],
    ["DAILY_PATHS_SHORT.ro", DAILY_PATHS_SHORT_RO],
    ["DAILY_PATHS_SHORT.en", DAILY_PATHS_SHORT_EN],
  ];

  let hasErrors = false;

  for (const [label, paths] of collections) {
    for (const [cluster, pathConfig] of Object.entries(paths ?? {})) {
      try {
        validatePathConfig(`${label}.${cluster}`, pathConfig as DailyPathConfig);
      } catch (error) {
        console.error(`[dailyPath validation] Error in ${label}.${cluster}:`, (error as Error).message);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log("[dailyPath validation] All configs look valid.");
  }
}

main();
