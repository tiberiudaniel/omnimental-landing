import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { getDb, ensureAuth } from "@/lib/firebase";
import { recordOmniAbilTaskCompletion } from "@/lib/progressFacts";

export type OmniAbilTaskType = "daily" | "weekly";
export type OmniAbilTaskStatus = "pending" | "done";

export type OmniAbilTask = {
  id: string;
  userId: string;
  arcId?: string;
  type: OmniAbilTaskType;
  title: string;
  description?: string;
  date: string;
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
    arcId: "claritate-energie",
  },
  weekly: {
    title: "Reset digital de seară",
    description: "Alege o seară fără ecrane cu 30 min înainte de somn și notează ce observi.",
    xpReward: 30,
    arcId: "claritate-energie",
  },
};

function pickTemplate(type: OmniAbilTaskType): TaskTemplate {
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
  const day = utc.getUTCDay() || 7;
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
  return { ...data, id };
}

async function writeTask(docId: string, payload: FirestoreTask) {
  const ref = doc(getDb(), "userAbilTasks", docId);
  await setDoc(
    ref,
    {
      ...payload,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  return ref;
}

export async function ensureOmniAbilTask(userId: string | null | undefined, type: OmniAbilTaskType): Promise<OmniAbilTask | null> {
  if (!userId) return null;
  const authUser = await ensureAuth();
  if (!authUser || authUser.uid !== userId) {
    return null;
  }
  const dateKey = type === "daily" ? getTodayKey() : getWeekKey();
  const docId = buildTaskId(userId, type, dateKey);
  const ref = doc(getDb(), "userAbilTasks", docId);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    return deserializeTask(snapshot.id, snapshot.data() as FirestoreTask);
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
  await writeTask(docId, payload);
  return deserializeTask(docId, payload);
}

export async function markOmniAbilTaskDone(task: OmniAbilTask | null | undefined): Promise<void> {
  if (!task?.id) return;
  const authUser = await ensureAuth();
  if (!authUser || authUser.uid !== task.userId) {
    return;
  }
  const ref = doc(getDb(), "userAbilTasks", task.id);
  await setDoc(
    ref,
    {
      status: "done",
      completedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await recordOmniAbilTaskCompletion({
    type: task.type,
    dateKey: task.date,
    xpReward: task.xpReward,
    ownerId: task.userId,
  });
}
