import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { getDb, ensureAuth } from "@/lib/firebase";
import { OMNI_ARCS } from "@/config/omniArcs";
import { recordOmniAbilTaskCompletion } from "./progressFacts/recorders";

export type OmniAbilTaskType = "daily" | "weekly";
export type OmniAbilTaskStatus = "pending" | "done";

export type OmniAbilTask = {
  id: string;
  userId: string;
  arcId?: string;
  type: OmniAbilTaskType;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD for daily / week start for weekly
  status: OmniAbilTaskStatus;
  completedAt?: Timestamp | null;
  xpReward?: number;
};

type TaskTemplate = {
  title: string;
  description?: string;
  xpReward?: number;
  arcId?: string;
};

const FALLBACK_TEMPLATES: Record<OmniAbilTaskType, TaskTemplate> = {
  daily: {
    title: "Respirație 2 minute",
    description: "Înainte de primul task important, inspiră 4 secunde și expiră 6 secunde timp de 2 minute.",
    xpReward: 10,
  },
  weekly: {
    title: "Reset digital de seară",
    description: "Alege o seară fără ecrane cu 30 min înainte de somn și notează ce observi.",
    xpReward: 30,
  },
};

function pickTemplate(type: OmniAbilTaskType): TaskTemplate {
  const activeArc = OMNI_ARCS.find((arc) => arc.status === "active");
  if (activeArc) {
    const template = activeArc.abilTaskTemplates.find((tpl) => tpl.type === type);
    if (template) {
      return {
        title: template.title,
        description: template.description,
        xpReward: template.suggestedXp,
        arcId: activeArc.id,
      };
    }
  }
  return FALLBACK_TEMPLATES[type];
}

function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayKey(baseDate: Date = new Date()): string {
  const utc = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()));
  return formatDateUTC(utc);
}

export function getWeekKey(baseDate: Date = new Date()): string {
  const utc = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()));
  const day = utc.getUTCDay() || 7; // 1-7 with Monday as 1
  if (day > 1) {
    utc.setUTCDate(utc.getUTCDate() - (day - 1));
  }
  return formatDateUTC(utc);
}

function buildTaskId(userId: string, type: OmniAbilTaskType, dateKey: string): string {
  return `${userId}_${type}_${dateKey}`;
}

type FirestoreTask = Omit<OmniAbilTask, "id"> & { id?: string };

function deserializeTask(id: string, data: FirestoreTask): OmniAbilTask {
  return {
    ...data,
    id,
  };
}

export async function ensureOmniAbilTask(userId: string, type: OmniAbilTaskType): Promise<OmniAbilTask | null> {
  if (!userId) return null;
  const authUser = await ensureAuth();
  if (!authUser || authUser.uid !== userId) {
    return null;
  }
  const dateKey = type === "daily" ? getTodayKey() : getWeekKey();
  const docId = buildTaskId(userId, type, dateKey);
  const ref = doc(getDb(), "userAbilTasks", docId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return deserializeTask(snap.id, snap.data() as FirestoreTask);
  }
  const template = pickTemplate(type);
  const payload: FirestoreTask = {
    userId,
    arcId: template.arcId,
    type,
    title: template.title,
    description: template.description,
    date: dateKey,
    status: "pending",
    xpReward: template.xpReward ?? (type === "daily" ? 10 : 30),
  };
  await setDoc(ref, {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return deserializeTask(docId, payload);
}

export async function markOmniAbilTaskDone(task: OmniAbilTask): Promise<void> {
  if (!task?.id) return;
  const authUser = await ensureAuth();
  if (!authUser || authUser.uid !== task.userId) {
    return;
  }
  const ref = doc(getDb(), "userAbilTasks", task.id);
  await setDoc(
    ref,
    {
      userId: task.userId,
      status: "done",
      completedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await recordOmniAbilTaskCompletion({
    type: task.type,
    dateKey: task.date,
    xpReward: task.xpReward,
  });
}
