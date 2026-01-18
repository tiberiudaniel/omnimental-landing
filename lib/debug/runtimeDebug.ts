"use client";

import { useSyncExternalStore } from "react";
import type { NavReasonCode } from "./reasons";

export type RuntimeNavReason = {
  code: NavReasonCode;
  details?: Record<string, unknown> | null;
  timestamp: number;
};

const STORAGE_KEY = "omnimental:lastNavReason";
const subscribers = new Set<() => void>();
let lastReason: RuntimeNavReason | null = null;
let hydrated = false;

function notifySubscribers() {
  subscribers.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore subscriber errors
    }
  });
}

function hydrateFromSessionStorage() {
  if (hydrated) return;
  hydrated = true;
  if (typeof window === "undefined") {
    return;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RuntimeNavReason;
      if (parsed?.code) {
        lastReason = parsed;
      }
    }
  } catch {
    // ignore storage parse failures
  }
}

export function setLastNavReason(code: NavReasonCode, details?: Record<string, unknown> | null) {
  if (typeof window === "undefined") return;
  const payload: RuntimeNavReason = {
    code,
    details: details ?? null,
    timestamp: Date.now(),
  };
  lastReason = payload;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
  notifySubscribers();
}

function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  hydrateFromSessionStorage();
  return lastReason;
}

export function useLastNavReason(): RuntimeNavReason | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
