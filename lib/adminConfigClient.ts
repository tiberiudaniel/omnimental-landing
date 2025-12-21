"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export type FlowStudioAdminConfig = {
  enabled?: boolean;
  admins?: string[];
  timezone?: string;
};

export function useFlowStudioConfig() {
  const [config, setConfig] = useState<FlowStudioAdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getDb();
    const ref = doc(db, "adminConfig", "flowStudio");
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        setConfig(snapshot.exists() ? (snapshot.data() as FlowStudioAdminConfig) : null);
        setLoading(false);
      },
      (err) => {
        setError(err.message ?? "Failed to load admin config");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  return { config, loading, error };
}

export function isAdminUser(email: string | null | undefined, config: FlowStudioAdminConfig | null): boolean {
  if (!config?.enabled) return false;
  if (!email || !config.admins?.length) return false;
  const normalized = email.trim().toLowerCase();
  return config.admins.some((entry) => entry.trim().toLowerCase() === normalized);
}
