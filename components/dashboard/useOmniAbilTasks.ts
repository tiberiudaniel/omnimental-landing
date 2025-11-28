"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  ensureOmniAbilTask,
  getTodayKey,
  getWeekKey,
  markOmniAbilTaskDone,
  type OmniAbilTask,
  type OmniAbilTaskType,
} from "@/lib/omniAbilTasks";

type HookState = {
  daily: OmniAbilTask | null;
  weekly: OmniAbilTask | null;
  loading: boolean;
  error: Error | null;
};

export function useOmniAbilTasks(userId?: string | null) {
  const [state, setState] = useState<HookState>({
    daily: null,
    weekly: null,
    loading: Boolean(userId),
    error: null,
  });
  const [markingId, setMarkingId] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) {
      setState({ daily: null, weekly: null, loading: false, error: null });
      return;
    }
    let active = true;
    const db = getDb();
    const unsubscribers: Array<() => void> = [];
    const setupWatcher = async (type: OmniAbilTaskType) => {
      try {
        await ensureOmniAbilTask(userId, type);
        if (!active) return;
        const dateKey = type === "daily" ? getTodayKey() : getWeekKey();
        const ref = doc(db, "userAbilTasks", `${userId}_${type}_${dateKey}`);
        const unsub = onSnapshot(
          ref,
          (snap) => {
            if (!snap.exists()) {
              setState((prev) => ({
                ...prev,
                [type]: null,
                loading: false,
              }));
              return;
            }
            const data = { id: snap.id, ...(snap.data() as OmniAbilTask) };
            setState((prev) => ({
              ...prev,
              [type]: data as OmniAbilTask,
              loading: false,
              error: null,
            }));
          },
          (error) => {
            setState((prev) => ({ ...prev, error, loading: false }));
          },
        );
        unsubscribers.push(unsub);
      } catch (error) {
        if (active) {
          setState((prev) => ({ ...prev, error: error as Error, loading: false }));
        }
      }
    };
    setState((prev) => ({ ...prev, loading: true }));
    setupWatcher("daily").catch(() => {});
    setupWatcher("weekly").catch(() => {});
    return () => {
      active = false;
      unsubscribers.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore unsubscription failures
        }
      });
    };
  }, [userId]);

  const markTask = useCallback(async (task: OmniAbilTask | null) => {
    if (!task || task.status === "done") return;
    setMarkingId(task.id);
    try {
      await markOmniAbilTaskDone(task);
    } finally {
      setMarkingId(null);
    }
  }, []);

  const isEmpty = useMemo(() => !state.daily && !state.weekly, [state.daily, state.weekly]);

  return {
    ...state,
    isEmpty,
    markTask,
    markingId,
  };
}
