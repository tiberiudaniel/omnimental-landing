"use client";

import { useEffect, useState } from "react";
import type { ArcState } from "@/types/arcState";
import type { UserMetrics } from "@/types/userMetrics";
import { getUserArcState, getUserMetrics } from "@/lib/arcStateStore";
import { useAuth } from "@/components/AuthProvider";

const DEBUG_ENABLED = Boolean(process.env.NEXT_PUBLIC_DEBUG_ARC_STATE);

export function ArcStateDebugPanel() {
  const { user } = useAuth();
  const [arcState, setArcState] = useState<ArcState | null>(null);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!DEBUG_ENABLED || !user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const [arc, met] = await Promise.all([
          getUserArcState(user.uid),
          getUserMetrics(user.uid),
        ]);
        if (!cancelled) {
          setArcState(arc ?? null);
          setMetrics(met ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  if (!DEBUG_ENABLED || !user?.uid) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-red-300 bg-red-50 p-4 text-xs text-red-900">
      <div className="mb-2 font-semibold">ArcState &amp; Metrics DEBUG (user: {user.uid})</div>
      {error ? <div className="mb-2 text-red-700">Error: {error}</div> : null}
      <pre className="overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(
          {
            arcState,
            metrics,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
