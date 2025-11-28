const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const selectors = loadTsModule(
  path.resolve(__dirname, "../../lib/dashboard/progressSelectors.ts"),
);

test("toMsLocal normalizes numbers, dates, and firestore timestamps", () => {
  const now = Date.now();
  assert.equal(selectors.toMsLocal(now), now);
  const date = new Date(now + 1000);
  assert.equal(selectors.toMsLocal(date), date.getTime());
  const fakeTs = { toDate: () => new Date(now + 2000) };
  assert.equal(selectors.toMsLocal(fakeTs), fakeTs.toDate().getTime());
  assert.equal(selectors.toMsLocal(undefined), 0);
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
  assert.equal(selectors.getCurrentFocusTag(facts), "relationships");
  const fallback = { intent: { categories: [{ category: "Obiceiuri", count: 1 }] } };
  assert.equal(selectors.getCurrentFocusTag(fallback), "general");
  assert.equal(selectors.getCurrentFocusTag(null), undefined);
});
