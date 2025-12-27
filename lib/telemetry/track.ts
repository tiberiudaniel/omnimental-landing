import { addDoc, collection, Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { getTrackingContext } from "./trackContext";

const FLOW_STUDIO_DIAG_ENABLED = process.env.NEXT_PUBLIC_FLOW_STUDIO_DIAG === "1";

type TelemetryDiagState = {
  eventsTotal: number;
  totalsByEvent: Record<string, number>;
  windowStart: number;
  windowEvents: number;
  windowByEvent: Record<string, number>;
  logTimer?: number;
};

declare global {
  interface Window {
    __omniDiag?: {
      telemetry?: TelemetryDiagState;
    };
  }
}

let cachedDb: ReturnType<typeof getDb> | null = null;

function getTelemetryDiagState(): TelemetryDiagState | null {
  if (!FLOW_STUDIO_DIAG_ENABLED || typeof window === "undefined") return null;
  if (!window.__omniDiag) {
    window.__omniDiag = {};
  }
  if (!window.__omniDiag.telemetry) {
    window.__omniDiag.telemetry = {
      eventsTotal: 0,
      totalsByEvent: {},
      windowStart: Date.now(),
      windowEvents: 0,
      windowByEvent: {},
    };
  }
  const state = window.__omniDiag.telemetry;
  if (!state.logTimer) {
    state.logTimer = window.setInterval(() => {
      logTelemetryRate(state);
    }, 30_000);
  }
  return state;
}

function logTelemetryRate(state: TelemetryDiagState) {
  const now = Date.now();
  const windowMs = Math.max(now - state.windowStart, 1);
  const ratePerMinute = (state.windowEvents / windowMs) * 60_000;
  const topEntries = Object.entries(state.windowByEvent)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([eventName, count]) => `${eventName}:${count}`)
    .join(", ");
  console.log(
    `[FlowStudioDiag] Telemetry rate: ${ratePerMinute.toFixed(1)}/min over ${(windowMs / 1000).toFixed(1)}s`,
    topEntries ? `top events: ${topEntries}` : "(no events)",
  );
}

function recordTelemetryDiag(eventName: string) {
  const state = getTelemetryDiagState();
  if (!state) return;
  const now = Date.now();
  if (now - state.windowStart >= 60_000) {
    state.windowStart = now;
    state.windowEvents = 0;
    state.windowByEvent = {};
  }
  state.eventsTotal += 1;
  state.totalsByEvent[eventName] = (state.totalsByEvent[eventName] ?? 0) + 1;
  state.windowEvents += 1;
  state.windowByEvent[eventName] = (state.windowByEvent[eventName] ?? 0) + 1;
  const windowMs = Math.max(now - state.windowStart, 1);
  const ratePerMinute = (state.windowEvents / windowMs) * 60_000;
  if (ratePerMinute > 200) {
    console.warn(`[FlowStudioDiag] Telemetry rate high: ${ratePerMinute.toFixed(1)}/min`);
    console.trace();
  }
}

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
  if (FLOW_STUDIO_DIAG_ENABLED) {
    recordTelemetryDiag(event);
  }
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
