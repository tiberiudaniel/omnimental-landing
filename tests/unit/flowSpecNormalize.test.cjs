const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const flowSpec = loadTsModule(path.resolve(__dirname, "../../lib/flowStudio/flowSpec.ts"));
const chunkUtils = loadTsModule(path.resolve(__dirname, "../../lib/flowStudio/chunkUtils.ts"));
const { normalizeFlowSpecPayload } = flowSpec;
const { UNGROUPED_CHUNK_ID } = chunkUtils;

test("normalizeFlowSpecPayload keeps chunks optional and warns for unknown references", () => {
  const preview = normalizeFlowSpecPayload({
    flow: { name: "Demo" },
    nodes: [
      { id: "n1", routeId: "r1", position: { x: 0, y: 0 }, chunkId: "missing" },
      { id: "n2", routeId: "r2", position: { x: 10, y: 5 }, chunkId: "known" },
      { id: "n3", routeId: "r3", position: { x: 4, y: 2 } },
    ],
    edges: [],
    chunks: [{ id: "known", title: "Known", order: 5 }],
  });
  assert.equal(preview.nodes[0].chunkId, UNGROUPED_CHUNK_ID, "unknown chunk mapped to ungrouped");
  assert.equal(preview.nodes[1].chunkId, "known");
  assert.equal(preview.nodes[2].chunkId, UNGROUPED_CHUNK_ID, "missing chunk defaults to ungrouped");
  assert.ok(Array.isArray(preview.comments));
  assert.ok(preview.warnings.length > 0);
  assert.ok(Array.isArray(preview.chunks));
  assert.ok(preview.chunks.some((chunk) => chunk.id === UNGROUPED_CHUNK_ID));
});

test("normalizeFlowSpecPayload throws when nodes list missing", () => {
  assert.throws(() => normalizeFlowSpecPayload({ flow: {}, edges: [] }), /nodes/);
});

test("normalizeFlowSpecPayload normalizes comments", () => {
  const preview = normalizeFlowSpecPayload({
    flow: {},
    nodes: [{ id: "a", routeId: "r1", position: { x: 0, y: 0 } }],
    edges: [],
    comments: [
      { id: "c1", targetType: "node", targetId: "a", message: "note" },
      { id: "c2", targetType: "chunk", targetId: "missing", message: "bad" },
    ],
    chunks: [{ id: "main", title: "Main", order: 0 }],
  });
  assert.equal(preview.comments?.length, 1);
  assert.equal(preview.comments?.[0].id, "c1");
});
