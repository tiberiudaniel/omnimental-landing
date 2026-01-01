import chunkSeedData from "@/config/flowStudioChunks.v1.json";
import type { FlowChunk, FlowChunkMeta } from "@/lib/flowStudio/types";

const COLOR_TOKEN_MAP: Record<string, string> = {
  public: "#f1f5f9",
  intro: "#e2e8f0",
  guided: "#fef3c7",
  onboarding: "#fee2e2",
  today: "#dcfce7",
  recommendation: "#ede9fe",
  progress: "#e0f2fe",
  training: "#ffe4e6",
  arenas: "#ffe4e6",
  library: "#ddd6fe",
  curriculum: "#ddd6fe",
  module: "#f3e8ff",
  hubs: "#f3e8ff",
  wizard: "#fde68a",
  advanced: "#fde68a",
  account: "#fed7aa",
  admin: "#fed7aa",
};

const CHUNK_ID_PREFIX = /^CH\d+_/i;

export type FlowStudioChunkSeedEntry = {
  id: string;
  title?: string;
  order?: number;
  color?: string;
  colorToken?: string;
  collapsedByDefault?: boolean;
  meta?: FlowChunkMeta | null;
};

export type FlowStudioChunkSeedPayload = {
  version?: string;
  chunks: FlowStudioChunkSeedEntry[];
};

type JsonSeedPayload = {
  version?: string;
  chunks?: FlowStudioChunkSeedEntry[];
};

export const FLOW_STUDIO_CHUNK_SEED_V1 = chunkSeedData as FlowStudioChunkSeedPayload;

const cloneMeta = (meta?: FlowChunkMeta | null) => {
  if (!meta) return undefined;
  return { ...meta };
};

const resolveSlug = (id: string) => id.replace(CHUNK_ID_PREFIX, "").toLowerCase();

const resolveSeedColor = (seed: FlowStudioChunkSeedEntry): string | undefined => {
  if (seed.color) return seed.color;
  if (seed.colorToken && COLOR_TOKEN_MAP[seed.colorToken]) {
    return COLOR_TOKEN_MAP[seed.colorToken];
  }
  return undefined;
};

const mergeMeta = (current?: FlowChunkMeta, incoming?: FlowChunkMeta | null): FlowChunkMeta | undefined => {
  if (!incoming) return current ? { ...current } : undefined;
  if (!current) return { ...incoming };
  return { ...current, ...incoming };
};

const updateChunkWithSeed = (chunk: FlowChunk, seed: FlowStudioChunkSeedEntry): FlowChunk => {
  const next: FlowChunk = {
    ...chunk,
  };
  if (!next.title && seed.title) {
    next.title = seed.title;
  }
  if (typeof next.order !== "number" && typeof seed.order === "number") {
    next.order = seed.order;
  }
  if (!next.color) {
    next.color = resolveSeedColor(seed);
  }
  if (typeof next.collapsedByDefault !== "boolean" && typeof seed.collapsedByDefault === "boolean") {
    next.collapsedByDefault = seed.collapsedByDefault;
  }
  const mergedMeta = mergeMeta(next.meta, seed.meta);
  if (mergedMeta) {
    next.meta = mergedMeta;
  }
  return next;
};

const createChunkFromSeed = (seed: FlowStudioChunkSeedEntry, fallbackOrder: number): FlowChunk => {
  return {
    id: seed.id,
    title: seed.title ?? seed.id,
    order: typeof seed.order === "number" ? seed.order : fallbackOrder,
    color: resolveSeedColor(seed),
    collapsedByDefault: typeof seed.collapsedByDefault === "boolean" ? seed.collapsedByDefault : undefined,
    meta: cloneMeta(seed.meta ?? undefined),
  };
};

export function mergeChunksWithSeed(existing: FlowChunk[], payload: FlowStudioChunkSeedPayload): FlowChunk[] {
  if (!payload?.chunks?.length) {
    return existing;
  }
  const next = existing.map((chunk) => ({
    ...chunk,
    meta: chunk.meta ? { ...chunk.meta } : undefined,
  })) as FlowChunk[];
  payload.chunks.forEach((seed, index) => {
    const normalizedId = seed.id?.trim();
    if (!normalizedId) {
      return;
    }
    const matchIndex = next.findIndex(
      (chunk) => chunk.id === normalizedId || resolveSlug(chunk.id) === normalizedId.toLowerCase(),
    );
    if (matchIndex >= 0) {
      next[matchIndex] = updateChunkWithSeed(next[matchIndex], seed);
    } else {
      next.push(createChunkFromSeed(seed, next.length + index + 1));
    }
  });
  return next;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

export function parseChunkImportPayload(rawText: string): FlowStudioChunkSeedPayload {
  if (!rawText.trim()) {
    throw new Error("Payload gol. Lipsește JSON-ul pentru import.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("JSON invalid. Verifică formatul payload-ului.");
  }
  if (!isPlainObject(parsed)) {
    throw new Error("Structură invalidă. Așteptam un obiect { version, chunks }.");
  }
  const payload = parsed as JsonSeedPayload;
  const chunksInput = Array.isArray(payload.chunks) ? payload.chunks : null;
  if (!chunksInput) {
    throw new Error('Structură invalidă. Cheia "chunks" lipsește sau nu este o listă.');
  }
  const sanitized: FlowStudioChunkSeedEntry[] = chunksInput.map((entry, index) => {
    if (!isPlainObject(entry)) {
      throw new Error(`Chunk invalid la poziția ${index}.`);
    }
    const id = typeof entry.id === "string" && entry.id.trim();
    if (!id) {
      throw new Error(`Chunk fără id la poziția ${index}.`);
    }
    const seed: FlowStudioChunkSeedEntry = {
      id,
      title: typeof entry.title === "string" ? entry.title : undefined,
      order: typeof entry.order === "number" ? entry.order : undefined,
      color: typeof entry.color === "string" ? entry.color : undefined,
      colorToken: typeof entry.colorToken === "string" ? entry.colorToken : undefined,
      collapsedByDefault:
        typeof entry.collapsedByDefault === "boolean" ? entry.collapsedByDefault : undefined,
      meta: isPlainObject(entry.meta) ? (entry.meta as FlowChunkMeta) : undefined,
    };
    return seed;
  });
  return {
    version: typeof payload.version === "string" ? payload.version : undefined,
    chunks: sanitized,
  };
}
