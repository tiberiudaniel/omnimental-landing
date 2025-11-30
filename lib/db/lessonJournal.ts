import { arrayUnion, doc, getDoc, serverTimestamp, setDoc, updateDoc, type Timestamp, type FieldValue } from "firebase/firestore";
import { getDb, areWritesDisabled, ensureAuth } from "@/lib/firebase";
import { recordRecentEntry } from "@/lib/progressFacts";
import type { LessonJournalEntry, LessonJournalBlock } from "@/lib/types/journal";

const COLLECTION = "lessonJournalEntries";

const buildDocId = (userId: string, moduleId: string, lessonId: string) => `${userId}__${moduleId}__${lessonId}`;

type FirestoreBlock = {
  id: string;
  kind: "note" | "snippet";
  text: string;
  screenId?: string | null;
  createdAt?: Timestamp | Date | FieldValue;
};

type FirestoreEntry = {
  userId: string;
  profileId?: string;
  sourceType: "omniKuno_lesson";
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
  blocks: FirestoreBlock[];
  createdAt?: Timestamp | Date | FieldValue;
  updatedAt?: Timestamp | Date | FieldValue;
};

const toDate = (value?: Timestamp | Date | FieldValue): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const maybeTs = value as Partial<Timestamp> & { toDate?: () => Date };
  if (typeof maybeTs?.toDate === "function") {
    try {
      return maybeTs.toDate();
    } catch {
      // fallthrough to now
    }
  }
  return new Date();
};

function deserializeEntry(id: string, data: FirestoreEntry): LessonJournalEntry {
  return {
    id,
    userId: data.userId,
    profileId: data.profileId ?? data.userId,
    sourceType: "omniKuno_lesson",
    moduleId: data.moduleId,
    lessonId: data.lessonId,
    lessonTitle: data.lessonTitle,
    blocks: (data.blocks || []).map((block) => ({
      id: block.id,
      kind: block.kind,
      text: block.text,
      screenId: block.screenId ?? null,
      createdAt: toDate(block.createdAt),
    })),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function getLessonJournalEntry(
  userId: string,
  moduleId: string,
  lessonId: string,
): Promise<LessonJournalEntry | null> {
  const authUser = await ensureAuth();
  if (!authUser?.uid) {
    return null;
  }
  const effectiveId = authUser.uid;
  if (userId && userId !== effectiveId) {
    console.warn("lesson journal read mismatch", { requested: userId, auth: effectiveId });
  }
  const ref = doc(getDb(), COLLECTION, buildDocId(effectiveId, moduleId, lessonId));
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return deserializeEntry(snap.id, snap.data() as FirestoreEntry);
  } catch (error) {
    console.warn("lesson journal read failed", error);
    throw error;
  }
}

export async function appendLessonJournalBlock(
  userId: string,
  moduleId: string,
  lessonId: string,
  lessonTitle: string,
  block: Omit<LessonJournalBlock, "id" | "createdAt">,
): Promise<LessonJournalEntry> {
  const authUser = await ensureAuth();
  if (!authUser?.uid) {
    throw new Error("User must be authenticated to use the lesson journal.");
  }
  const effectiveUserId = authUser.uid;
  if (userId && userId !== effectiveUserId) {
    console.warn("lesson journal owner mismatch", { ownerId: userId, authId: effectiveUserId });
  }
  if (areWritesDisabled()) {
    const existing = await getLessonJournalEntry(effectiveUserId, moduleId, lessonId);
    if (existing) return existing;
    throw new Error("Writings are disabled in this environment.");
  }
  const db = getDb();
  const docId = buildDocId(effectiveUserId, moduleId, lessonId);
  const ref = doc(db, COLLECTION, docId);
  const snap = await getDoc(ref);
  const blockKind: "note" | "snippet" = block.kind ?? "note";
  const newBlock: FirestoreBlock = {
    id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    kind: blockKind,
    text: block.text,
    screenId: block.screenId ?? null,
    createdAt: new Date(),
  };
  if (snap.exists()) {
    await updateDoc(ref, {
      lessonTitle,
      profileId: effectiveUserId,
      updatedAt: serverTimestamp(),
      blocks: arrayUnion(newBlock),
    });
  } else {
    await setDoc(ref, {
      userId: effectiveUserId,
      profileId: effectiveUserId,
      sourceType: "omniKuno_lesson",
      moduleId,
      lessonId,
      lessonTitle,
      blocks: [newBlock],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  const entry = await getLessonJournalEntry(effectiveUserId, moduleId, lessonId);
  if (!entry) {
    throw new Error("Unable to load journal entry after write.");
  }
  try {
    await recordRecentEntry(
      {
        text: block.text,
        sourceType: "omniKuno_lesson",
        theme: lessonTitle,
        sourceBlock: lessonId,
        moduleId,
        lessonId,
        lessonTitle,
      },
      new Date(),
      effectiveUserId,
    );
  } catch (error) {
    console.warn("lesson journal recent entry failed", error);
  }
  return entry;
}
