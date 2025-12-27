const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const matching = loadTsModule(path.resolve(__dirname, "../../lib/vocab/matching.ts"));
const vocabConfig = loadTsModule(path.resolve(__dirname, "../../config/catVocabulary.ts"));

const { pickVocabPrimary } = matching;
const { CAT_VOCABULARY } = vocabConfig;
const vocabBank = Object.values(CAT_VOCABULARY);

test("pickVocabPrimary honors primary tag even with soft recency", () => {
  const ctx = {
    mindInfoAnswerTagPrimary: "clarity_low",
    mindInfoAnswerTagsSecondary: [],
    recentVocabIds: ["clarity_fog", "clarity_story_strip", "focus_scattered", "focus_hurried", "buffer_space"],
    avoidDayKeys: ["2025-03-10", "2025-03-09"],
    lastShownById: {
      clarity_fog: "2025-03-08",
      clarity_story_strip: "2025-03-07",
    },
  };
  const result = pickVocabPrimary(ctx, vocabBank);
  assert.ok(result);
  assert.equal(result.tagsPrimary[0], "clarity_low");
  assert.equal(Boolean(result.isBuffer), false);
});

test("does not choose buffer when repeat non-buffer exists in last five", () => {
  const ctx = {
    mindInfoAnswerTagPrimary: "clarity_low",
    recentVocabIds: ["buffer_space", "clarity_fog", "clarity_story_strip", "buffer_rhythm", "energy_tired"],
    avoidDayKeys: ["2025-03-10", "2025-03-09"],
    lastShownById: {
      clarity_fog: "2025-03-08",
      clarity_story_strip: "2025-03-07",
      buffer_space: "2025-03-06",
      buffer_rhythm: "2025-03-05",
    },
  };
  const result = pickVocabPrimary(ctx, vocabBank);
  assert.ok(result);
  assert.equal(Boolean(result.isBuffer), false);
  assert.equal(result.tagsPrimary[0], "clarity_low");
});

test("falls back to buffer only when no non-buffer survives", () => {
  const ctx = {
    mindInfoAnswerTagPrimary: "meta_observe",
    mindInfoAnswerTagsSecondary: [],
    recentVocabIds: [],
    avoidDayKeys: ["2025-02-01"],
  };
  const result = pickVocabPrimary(ctx, vocabBank);
  assert.ok(result);
  assert.equal(Boolean(result.isBuffer), true);
});
