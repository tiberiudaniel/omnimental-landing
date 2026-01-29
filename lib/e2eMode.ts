declare global {
  interface Window {
    __OMNI_E2E__?: boolean;
  }
}

type E2EStore = {
  profiles: Record<string, unknown>;
  telemetry: Record<string, unknown[]>;
};

const globalRef = typeof globalThis !== "undefined" ? (globalThis as { __OMNI_E2E__?: boolean; __OMNI_E2E_STORE__?: E2EStore }) : undefined;

const envFlag = (process.env.NEXT_PUBLIC_E2E_MODE || "").toLowerCase();

export const E2E_USER_ID = "e2e-user";

function getStore(): E2EStore {
  if (!globalRef) {
    throw new Error("E2E store is unavailable in this environment");
  }
  if (!globalRef.__OMNI_E2E_STORE__) {
    globalRef.__OMNI_E2E_STORE__ = { profiles: {}, telemetry: {} };
  }
  return globalRef.__OMNI_E2E_STORE__;
}

function markE2EFlag() {
  if (!globalRef) return;
  globalRef.__OMNI_E2E__ = true;
  if (typeof window !== "undefined") {
    window.__OMNI_E2E__ = true;
  }
}

export function isE2EMode(): boolean {
  if (envFlag === "1" || envFlag === "true") {
    markE2EFlag();
    return true;
  }
  if (typeof window !== "undefined") {
    if (window.__OMNI_E2E__) return true;
    try {
      if (typeof document !== "undefined" && document.cookie) {
        const cookieEntries = document.cookie.split(";").map((entry) => entry.trim());
        const e2eCookie = cookieEntries.find((entry) => entry.startsWith("omni_e2e="));
        if (e2eCookie) {
          const value = e2eCookie.split("=")[1]?.toLowerCase();
          if (value === "1" || value === "true") {
            markE2EFlag();
            return true;
          }
        }
      }
    } catch {
      // ignore cookie parsing failures
    }
    try {
      const params = new URLSearchParams(window.location.search);
      if ((params.get("e2e") || "").toLowerCase() === "1") {
        markE2EFlag();
        return true;
      }
    } catch {
      // ignore
    }
  }
  return Boolean(globalRef?.__OMNI_E2E__);
}

export function getE2EProfileSnapshot<T = unknown>(userId: string): T | null {
  if (!globalRef?.__OMNI_E2E__) return null;
  const store = getStore();
  return (store.profiles[userId] as T) ?? null;
}

export function setE2EProfileSnapshot(userId: string, snapshot: unknown): void {
  if (!globalRef) return;
  markE2EFlag();
  const store = getStore();
  store.profiles[userId] = snapshot;
}

export function pushE2ETelemetryEntry(userId: string, entry: unknown): void {
  if (!globalRef) return;
  markE2EFlag();
  const store = getStore();
  if (!store.telemetry[userId]) {
    store.telemetry[userId] = [];
  }
  store.telemetry[userId]!.push(entry);
}

export function readE2ETelemetry<T = unknown>(userId: string): T[] {
  if (!globalRef?.__OMNI_E2E__) return [];
  const store = getStore();
  return (store.telemetry[userId] as T[] | undefined)?.slice() ?? [];
}
