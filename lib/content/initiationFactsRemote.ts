import { doc, setDoc } from "firebase/firestore";
import { INITIATION_MODULES } from "@/config/content/initiations/modules";
import { getLocalCompletionStreak } from "@/lib/dailyCompletion";
import { getNextLessonInModule } from "@/lib/content/getNextLessonInModule";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";
import { getDb, ensureAuth } from "@/lib/firebase";
import type { InitiationProgressState } from "@/lib/content/initiationProgressStorage";

const MAX_REMOTE_COMPLETED = 200;
const lastPayloadHashByUser = new Map<string, string>();

export type RecorderDeps = {
  ensureAuth: typeof ensureAuth;
  getDb: typeof getDb;
  doc: typeof doc;
  setDoc: typeof setDoc;
};

const defaultRecorderDeps: RecorderDeps = {
  ensureAuth,
  getDb,
  doc,
  setDoc,
};

const computePayloadHash = (payload: RemoteInitiationFacts): string => JSON.stringify(payload);

export function __resetInitiationFactsRemoteCache(): void {
  lastPayloadHashByUser.clear();
}

export type RemoteInitiationFacts = {
  activeWorld: "INITIATION";
  currentModuleId: ModuleId;
  completedLessons: number;
  moduleLessonCount: number;
  nextLessonId: LessonId | null;
  streakDays: number;
  completedLessonIds: LessonId[];
  lastCompletedAt: string;
};

export function buildRemoteInitiationFacts(
  state: InitiationProgressState | null,
  completedAt: Date = new Date(),
): RemoteInitiationFacts | null {
  if (!state?.moduleId) return null;
  const moduleMeta = INITIATION_MODULES[state.moduleId];
  if (!moduleMeta) return null;
  const completedUnique = Array.from(new Set(state.completedLessonIds));
  const trimmedCompleted = completedUnique.slice(-MAX_REMOTE_COMPLETED) as LessonId[];
  const nextLesson = getNextLessonInModule(state.moduleId, state.completedLessonIds);
  return {
    activeWorld: "INITIATION",
    currentModuleId: state.moduleId,
    completedLessons: Math.min(state.completedLessonIds.length, moduleMeta.lessonIds.length),
    moduleLessonCount: moduleMeta.lessonIds.length,
    nextLessonId: nextLesson ?? null,
    streakDays: getLocalCompletionStreak(),
    completedLessonIds: trimmedCompleted,
    lastCompletedAt: completedAt.toISOString(),
  };
}

export async function persistRemoteInitiationFacts(
  userId: string | null | undefined,
  state: InitiationProgressState | null,
  completedAt: Date = new Date(),
  deps: RecorderDeps = defaultRecorderDeps,
): Promise<void> {
  if (!userId) return;
  const payload = buildRemoteInitiationFacts(state, completedAt);
  if (!payload) return;
  const hash = computePayloadHash(payload);
  if (lastPayloadHashByUser.get(userId) === hash) return;
  try {
    const authUser = await deps.ensureAuth().catch(() => null);
    if (!authUser || authUser.uid !== userId) return;
    const db = deps.getDb();
    const ref = deps.doc(db, "userProgressFacts", userId);
    await deps.setDoc(ref, { initiation: payload }, { merge: true });
    lastPayloadHashByUser.set(userId, hash);
  } catch {
    // Remote persistence failures should never break the client flow.
  }
}
