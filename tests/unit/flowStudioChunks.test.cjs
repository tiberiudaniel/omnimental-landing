const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const chunkUtils = loadTsModule(path.resolve(__dirname, "../../lib/flowStudio/chunkUtils.ts"));
const {
  buildChunkGraph,
  buildChunkAutoAssignLookup,
  normalizeChunks,
  UNGROUPED_CHUNK_ID,
  ensureNodesHaveValidChunks,
  autoAssignChunksByRouteGroup,
  previewChunkAssignments,
} = chunkUtils;
const { mergeChunksWithSeed } = loadTsModule(path.resolve(__dirname, "../../lib/flowStudio/chunkSeed.ts"));

function makeNode(id, chunkId, extra = {}) {
  return {
    id,
    type: "flowNode",
    position: { x: 0, y: 0 },
    data: {
      routeId: `${id}-route`,
      routePath: `/${id}`,
      filePath: `${id}.tsx`,
      screenId: `${id}-screen`,
      labelOverrides: {},
      tags: extra.tags ?? [],
      chunkId,
    },
    ...extra.reactMeta,
  };
}

test("buildChunkGraph aggregates nodes, counts, and edges", () => {
  const chunks = normalizeChunks([
    { id: "chunk-alpha", title: "Alpha", order: 1, meta: { routeGroups: ["alpha"], routePrefixes: ["/one"] } },
    { id: "chunk-beta", title: "Beta", order: 2, meta: { routeGroups: ["beta"], routePrefixes: ["/two"] } },
  ]);
  const nodes = [
    makeNode("a", "chunk-alpha", { tags: ["start"] }),
    makeNode("b", "chunk-alpha"),
    makeNode("c", "chunk-beta"),
    makeNode("d", "missing"),
  ];
  const edges = [
    { id: "e1", source: "a", target: "c", data: {}, selected: false },
    { id: "e2", source: "c", target: "d", data: {}, selected: false },
    { id: "e3", source: "a", target: "b", data: {}, selected: false },
    { id: "e4", source: "b", target: "c", data: {}, selected: false },
  ];
  const graph = buildChunkGraph(nodes, edges, chunks);
  assert.equal(graph.nodes.length, chunks.length, "should build chunk nodes for each chunk");
  const alphaStats = graph.countsByChunk.get("chunk-alpha");
  assert.deepEqual(alphaStats, { total: 2, start: 1, unreachable: 0 });
  const betaStats = graph.countsByChunk.get("chunk-beta");
  assert.equal(betaStats.total, 1);
  const ungroupedStats = graph.countsByChunk.get(UNGROUPED_CHUNK_ID);
  assert.equal(ungroupedStats.total, 1, "unknown chunk nodes fall back to ungrouped");
  const edgeMap = new Map(graph.edges.map((edge) => [edge.id, edge]));
  assert.equal(edgeMap.size, 2, "edges collapse by chunk pair");
  const alphaToBeta = Array.from(edgeMap.values()).find((edge) => edge.source.endsWith("chunk-alpha") && edge.target.endsWith("chunk-beta"));
  assert.ok(alphaToBeta, "chunk alpha connects to beta");
  assert.equal(alphaToBeta.label, "2", "edge weight label preserved");
});

test("normalizeChunks is idempotent and keeps Ungrouped", () => {
  const first = normalizeChunks([
    { id: "a", title: "A", order: 2 },
    { id: "b", title: "B", order: 1 },
  ]);
  const second = normalizeChunks(first);
  assert.deepEqual(second, normalizeChunks(second));
  assert.ok(second.some((chunk) => chunk.id === UNGROUPED_CHUNK_ID));
});

test("normalizeChunks preserves meta information", () => {
  const chunks = normalizeChunks([
    {
      id: "chunk-meta",
      title: "Meta",
      order: 3,
      meta: {
        tierMin: 2,
        menuState: "CORE",
        target: { ro: "Ținta" },
        routeGroups: ["meta-group"],
      },
    },
  ]);
  const entry = chunks.find((chunk) => chunk.id === "chunk-meta");
  assert.ok(entry, "chunk should exist");
  assert.equal(entry.meta?.tierMin, 2);
  assert.equal(entry.meta?.menuState, "CORE");
  assert.deepEqual(entry.meta?.target, { ro: "Ținta" });
  assert.deepEqual(entry.meta?.routeGroups, ["meta-group"]);
});

test("ensureNodesHaveValidChunks reassigns missing chunks", () => {
  const nodes = [
    makeNode("one", "custom"),
    makeNode("two", "missing"),
  ];
  const chunks = normalizeChunks([{ id: "custom", title: "Custom", order: 1 }]);
  const normalized = ensureNodesHaveValidChunks(nodes, chunks);
  assert.equal(normalized[0].data.chunkId, "custom");
  assert.equal(normalized[1].data.chunkId, UNGROUPED_CHUNK_ID);
});

test("autoAssignChunksByRouteGroup only fills missing chunkIds", () => {
  const routeMap = new Map([
    ["r1", { id: "r1", routePath: "/one", group: "alpha", filePath: "one.tsx" }],
    ["r2", { id: "r2", routePath: "/two", group: "beta", filePath: "two.tsx" }],
  ]);
  const chunks = normalizeChunks([
    { id: "chunk-alpha", title: "Alpha", order: 1, meta: { routeGroups: ["alpha"], routePrefixes: ["/one"] } },
    { id: "chunk-beta", title: "Beta", order: 2, meta: { routeGroups: ["beta"], routePrefixes: ["/two"] } },
  ]);
  const chunkLookup = buildChunkAutoAssignLookup(chunks);
  const nodes = [makeNode("one", UNGROUPED_CHUNK_ID), makeNode("two", "chunk-beta")];
  nodes[0].data.routeId = "r1";
  nodes[1].data.routeId = "r2";
  const assigned = autoAssignChunksByRouteGroup(nodes, routeMap, chunkLookup);
  assert.equal(assigned[0].data.chunkId, "chunk-alpha", "node without chunk assigned");
  assert.equal(assigned[1].data.chunkId, "chunk-beta", "existing chunk retained");
});

test("autoAssignChunksByRouteGroup prefers longest matching prefix", () => {
  const routeMap = new Map([
    ["intro", { id: "intro", routePath: "/intro/guided/day1", group: "intro", filePath: "intro.tsx" }],
  ]);
  const chunks = normalizeChunks([
    { id: "CH02_entry_intro", title: "Intro", order: 1, meta: { routePrefixes: ["/intro"] } },
    { id: "CH03_guided_day1", title: "Guided", order: 2, meta: { routePrefixes: ["/intro/guided"] } },
  ]);
  const lookup = buildChunkAutoAssignLookup(chunks);
  const nodes = [makeNode("intro", UNGROUPED_CHUNK_ID)];
  nodes[0].data.routeId = "intro";
  const assigned = autoAssignChunksByRouteGroup(nodes, routeMap, lookup);
  assert.equal(assigned[0].data.chunkId, "CH03_guided_day1");
});

test("previewChunkAssignments reports summary and ambiguous matches", () => {
  const routeMap = new Map([
    ["r1", { id: "r1", routePath: "/intro/example", group: "intro", filePath: "intro.tsx" }],
    ["r2", { id: "r2", routePath: "/intro/example", group: "intro", filePath: "intro-2.tsx" }],
  ]);
  const chunks = normalizeChunks([
    { id: "CH02_entry_intro", title: "Intro", order: 1, meta: { routePrefixes: ["/intro"] } },
    {
      id: "custom",
      title: "Custom Intro",
      order: 3,
      meta: { routePrefixes: ["/intro"], routeGroups: ["intro-custom"] },
    },
  ]);
  const lookup = buildChunkAutoAssignLookup(chunks);
  const nodes = [makeNode("one", UNGROUPED_CHUNK_ID), makeNode("two", UNGROUPED_CHUNK_ID)];
  nodes[0].data.routeId = "r1";
  nodes[1].data.routeId = "r2";
  const preview = previewChunkAssignments(nodes, routeMap, chunks, lookup);
  assert.ok(preview.summary.length >= 2, "summary should be present");
  assert.equal(preview.changes.length, 2, "both nodes receive assignments");
  assert.ok(preview.ambiguous.length >= 1, "ambiguous matches highlighted");
});

test("mergeChunksWithSeed merges metadata for matching chunks", () => {
  const existing = normalizeChunks([{ id: "CH01_public", title: "Public", order: 0 }]);
  const payload = {
    version: "chunks-v1",
    chunks: [
      {
        id: "public",
        meta: {
          target: { ro: "Țintă" },
          tierMin: 0,
          routeGroups: ["public"],
        },
      },
    ],
  };
  const merged = mergeChunksWithSeed(existing, payload);
  assert.equal(merged.length, existing.length, "no duplicate chunk should be added");
  const chunk = merged.find((entry) => entry.id === "CH01_public");
  assert.ok(chunk?.meta, "meta should exist after merge");
  assert.equal(chunk?.meta?.target?.ro, "Țintă");
  assert.equal(chunk?.meta?.tierMin, 0);
});

test("mergeChunksWithSeed adds missing chunks from payload", () => {
  const existing = normalizeChunks([{ id: "custom", title: "Custom", order: 0 }]);
  const payload = {
    version: "chunks-v1",
    chunks: [
      {
        id: "new-chunk",
        title: "New Chunk",
        order: 5,
        meta: { tierMin: 2 },
      },
    ],
  };
  const merged = mergeChunksWithSeed(existing, payload);
  const added = merged.find((chunk) => chunk.id === "new-chunk");
  assert.ok(added, "new chunk should be added");
  assert.equal(added.meta?.tierMin, 2);
});
