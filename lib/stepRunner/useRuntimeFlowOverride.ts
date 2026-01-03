"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, type FirestoreError } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

type RuntimeFlowDoc = {
  routePath?: string;
  stepOrderOverride?: string[];
  updatedAtMs?: number;
};

function toFlowId(routePath: string): string {
  const trimmed = routePath.replace(/^\/+/, "");
  return trimmed ? trimmed.replace(/\//g, "__") : "root";
}

function sanitizeOverride(list: unknown): string[] | null {
  if (!Array.isArray(list)) return null;
  const filtered = list
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => Boolean(entry)) as string[];
  if (!filtered.length) return null;
  return Array.from(new Set(filtered));
}

export function useRuntimeFlowOverride(routePath: string): string[] | null {
  const [override, setOverride] = useState<string[] | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let isMounted = true;
    const db = getDb();
    const flowId = toFlowId(routePath);
    const ref = doc(db, "runtimeFlows", flowId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (!isMounted) return;
        const data = snapshot.data() as RuntimeFlowDoc | undefined;
        const nextOverride = sanitizeOverride(data?.stepOrderOverride);
        setOverride(nextOverride);
      },
      (error: FirestoreError) => {
        console.warn("[step-runner] runtime override subscribe failed", error);
        if (isMounted) {
          setOverride(null);
        }
      },
    );
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [routePath]);
  return override;
}
