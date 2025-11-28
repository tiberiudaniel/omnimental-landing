"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  ensureOmniAbilTask,
  getFallbackOmniAbilTemplate,
  getTodayKey,
  getWeekKey,
  markOmniAbilTaskDone,
  type OmniAbilTask,
  type OmniAbilTaskStatus,
  type OmniAbilTaskType,
} from "@/lib/omniAbilTasks";

type HookState = {
  daily: OmniAbilTask | null;
  weekly: OmniAbilTask | null;
  loading: boolean;
  error: Error | null;
};

const LOCAL_FALLBACK_USER_ID = "local-fallback";
const LOCAL_TASK_STORAGE_KEY = "omnimental_omniabil_local_v1";

type LocalTaskSnapshot = { date: string; status: OmniAbilTaskStatus };
type LocalTaskStorage = { daily?: LocalTaskSnapshot; weekly?: LocalTaskSnapshot };

function readLocalTaskStorage(): LocalTaskStorage {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_TASK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalTaskStorage) : {};
  } catch {
    return {};
  }
}

function writeLocalTaskStorage(store: LocalTaskStorage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_TASK_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage failures
  }
}

function buildLocalTask(type: OmniAbilTaskType, dateKey: string, status: OmniAbilTaskStatus): OmniAbilTask {
  const template = getFallbackOmniAbilTemplate(type);
  const xpReward = template.xpReward ?? (type === "daily" ? 10 : 30);
  return {
    id: `${LOCAL_FALLBACK_USER_ID}_${type}_${dateKey}`,
    userId: LOCAL_FALLBACK_USER_ID,
    arcId: template.arcId,
    type,
    title: template.title,
    description: template.description,
    date: dateKey,
    status,
    xpReward,
  };
}

function initializeLocalTasks(): { daily: OmniAbilTask; weekly: OmniAbilTask } {
  const store = readLocalTaskStorage();
  const todayKey = getTodayKey();
  const weekKey = getWeekKey();
  const nextStore: LocalTaskStorage = { ...store };
  if (!nextStore.daily || nextStore.daily.date !== todayKey) {
    nextStore.daily = { date: todayKey, status: "pending" };
  }
  if (!nextStore.weekly || nextStore.weekly.date !== weekKey) {
    nextStore.weekly = { date: weekKey, status: "pending" };
  }
  writeLocalTaskStorage(nextStore);
  return {
    daily: buildLocalTask("daily", todayKey, nextStore.daily!.status),
    weekly: buildLocalTask("weekly", weekKey, nextStore.weekly!.status),
  };
}

function persistLocalTask(type: OmniAbilTaskType, snapshot: LocalTaskSnapshot) {
  const store = readLocalTaskStorage();
  if (type === "daily") {
    store.daily = snapshot;
  } else {
    store.weekly = snapshot;
  }
  writeLocalTaskStorage(store);
}

export function useOmniAbilTasks(userId?: string | null) {
  const [state, setState] = useState<HookState>({
    daily: null,
    weekly: null,
    loading: Boolean(userId),
    error: null,
  });
  const [markingId, setMarkingId] = useState<string | null>(null);
  const fallbackMode = !userId || /^guest[-_]/i.test(userId) || /^demo/i.test(userId);

  useEffect(() => {
    if (fallbackMode) {
      const { daily, weekly } = initializeLocalTasks();
      setState({ daily, weekly, loading: false, error: null });
      return;
    }
    const effectiveUserId = userId!;
    let active = true;
    const db = getDb();
    const unsubscribers: Array<() => void> = [];
    const setupWatcher = async (type: OmniAbilTaskType) => {
      try {
        await ensureOmniAbilTask(effectiveUserId, type);
        if (!active) return;
        const dateKey = type === "daily" ? getTodayKey() : getWeekKey();
        const ref = doc(db, "userAbilTasks", `${effectiveUserId}_${type}_${dateKey}`);
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
            const raw = snap.data() as OmniAbilTask;
            const data: OmniAbilTask = { ...raw, id: snap.id };
            setState((prev) => ({
              ...prev,
              [type]: data,
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
  }, [fallbackMode, userId]);

  const markTask = useCallback(async (task: OmniAbilTask | null) => {
    if (!task || task.status === "done") return;
    if (task.userId === LOCAL_FALLBACK_USER_ID) {
      const updated: OmniAbilTask = { ...task, status: "done" };
      setState((prev) => ({ ...prev, [task.type]: updated }));
      persistLocalTask(task.type, { date: task.date, status: "done" });
      return;
    }
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
