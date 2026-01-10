"use client";

import { useEffect, useMemo, useState } from "react";
import {
  readInitiationProgressState,
  type InitiationProgressState,
  INITIATION_PROGRESS_EVENT,
} from "@/lib/content/initiationProgressStorage";

export const useInitiationProgress = (userId: string | null) => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((prev) => prev + 1);
    if (typeof window !== "undefined") {
      window.addEventListener(INITIATION_PROGRESS_EVENT, handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(INITIATION_PROGRESS_EVENT, handler);
      }
    };
  }, []);

  const snapshot = useMemo<InitiationProgressState | null>(() => {
    void version;
    return readInitiationProgressState(userId);
  }, [version, userId]);

  return snapshot;
};
