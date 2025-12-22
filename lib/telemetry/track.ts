import { addDoc, collection, Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { getTrackingContext } from "./trackContext";

let cachedDb: ReturnType<typeof getDb> | null = null;

function getClientDb() {
  if (typeof window === "undefined") return null;
  if (!cachedDb) {
    try {
      cachedDb = getDb();
    } catch (error) {
      console.warn("[telemetry] failed to init db", error);
      return null;
    }
  }
  return cachedDb;
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > 2) return "[clipped]";
  if (Array.isArray(value)) {
    return value.slice(0, 5).map((entry) => sanitizeValue(entry, depth + 1));
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 10).map(([key, val]) => [key, sanitizeValue(val, depth + 1)]);
    return Object.fromEntries(entries);
  }
  if (typeof value === "string" && value.length > 200) {
    return `${value.slice(0, 200)}…`;
  }
  return value;
}

function sanitizePayload(payload?: Record<string, unknown>) {
  if (!payload) return null;
  try {
    return sanitizeValue(payload);
  } catch {
    return null;
  }
}

export async function track(event: string, payload?: Record<string, unknown>) {
  try {
    console.log("[telemetry]", event, payload ?? {});
  } catch {
    // Swallow errors silently to avoid breaking UX
  }

  try {
    const db = getClientDb();
    if (!db) return;
    const ctx = getTrackingContext();
    if (!ctx.userId) return;
    const sanitizedPayload = sanitizePayload(payload);
    await addDoc(collection(db, "telemetryEvents"), {
      event,
      userId: ctx.userId,
      isPremium: ctx.isPremium ?? null,
      accessTier: ctx.accessTier ?? null,
      locale: ctx.locale ?? null,
      origin: ctx.origin ?? null,
      routePath: ctx.routePath ?? null,
      ts: Timestamp.now(),
      payload: sanitizedPayload,
    });
  } catch (error) {
    console.warn("[telemetry] failed to persist", error);
  }
}
