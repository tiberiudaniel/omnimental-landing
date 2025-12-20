const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  setItem(key, value) {
    this.store.set(key, typeof value === "string" ? value : String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function resetStorage() {
  global.window = {
    localStorage: new MemoryStorage(),
  };
}

resetStorage();

const vocabProgress = loadTsModule(path.resolve(__dirname, "../../lib/vocabProgress.ts"));
const {
  wasVocabShownToday,
  markVocabShownToday,
  getShownVocabIdForToday,
  setShownVocabIdForToday,
} = vocabProgress;

test("primer gating persists per day", () => {
  resetStorage();
  const dayKey = "2025-01-01";
  assert.equal(wasVocabShownToday(dayKey), false);
  markVocabShownToday(dayKey);
  assert.equal(wasVocabShownToday(dayKey), true);
  // second mark should not change behavior
  markVocabShownToday(dayKey);
  assert.equal(wasVocabShownToday(dayKey), true);
  assert.equal(wasVocabShownToday("2025-01-02"), false);
});

test("completion banner reads the stored vocab for the same day", () => {
  resetStorage();
  const dayKey = "2025-02-10";
  setShownVocabIdForToday(dayKey, "clarity_fog");
  assert.equal(getShownVocabIdForToday(dayKey), "clarity_fog");
  assert.equal(getShownVocabIdForToday("2025-02-11"), null);
});
