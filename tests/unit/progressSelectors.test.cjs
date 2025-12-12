const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const selectorsModule = loadTsModule(
  path.resolve(__dirname, "../../lib/dashboard/progressSelectors.ts"),
);
const { getCurrentFocusTag, toMsLocal, FOCUS_KEYWORD_MODULE_MAP } = selectorsModule;
const { OMNIKUNO_MODULE_IDS } = loadTsModule(
  path.resolve(__dirname, "../../config/omniKunoModules.ts"),
);

test("toMsLocal normalizes numbers, dates, and firestore timestamps", () => {
  const now = Date.now();
  assert.equal(toMsLocal(now), now);
  const date = new Date(now + 1000);
  assert.equal(toMsLocal(date), date.getTime());
  const fakeTs = { toDate: () => new Date(now + 2000) };
  assert.equal(toMsLocal(fakeTs), fakeTs.toDate().getTime());
  assert.equal(toMsLocal(undefined), 0);
});

test("getCurrentFocusTag returns normalized focus key", () => {
  const facts = {
    intent: {
      categories: [
        { category: "Claritate", count: 2 },
        { category: "Relatii", count: 5 },
      ],
    },
  };
  assert.equal(getCurrentFocusTag(facts), "relationships_communication");
  const fallback = { intent: { categories: [{ category: "Obiceiuri", count: 1 }] } };
  assert.equal(getCurrentFocusTag(fallback), "energy_body");
  assert.equal(getCurrentFocusTag(null), undefined);
});

test("FOCUS_KEYWORD_MODULE_MAP stays within known OmniKuno modules", () => {
  const moduleIdSet = new Set(OMNIKUNO_MODULE_IDS);
  Object.values(FOCUS_KEYWORD_MODULE_MAP).forEach((moduleId) => {
    assert.ok(
      moduleIdSet.has(moduleId),
      `Unknown moduleId in focus map: ${moduleId}`,
    );
  });
});
