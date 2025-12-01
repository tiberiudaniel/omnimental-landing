import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";
import { areWritesDisabled, ensureAuth, getDb } from "@/lib/firebase";

const COLLECTION = "kunoQuizAttempts";

const buildDocId = (userId: string, lessonId: string) => `${userId}__${lessonId}`;

type FirestoreAnswer = {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  locked?: boolean;
  submittedAt?: Timestamp | Date | FieldValue | null;
};

type FirestoreAttempt = {
  userId: string;
  moduleId: string;
  lessonId: string;
  quizTopicKey?: string | null;
  locked?: boolean;
  score?: number;
  createdAt?: Timestamp | Date | FieldValue | null;
  updatedAt?: Timestamp | Date | FieldValue | null;
  answers?: FirestoreAnswer[];
};

export type QuizAnswerRecord = {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  locked: boolean;
  submittedAt: Date;
};

export type KunoQuizAttempt = {
  id: string;
  userId: string;
  moduleId: string;
  lessonId: string;
  quizTopicKey?: string | null;
  locked: boolean;
  score: number;
  answers: QuizAnswerRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type LockQuizPayload = {
  moduleId: string;
  lessonId: string;
  quizTopicKey?: string | null;
  score: number;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }>;
};

const toDate = (value?: Timestamp | Date | FieldValue | null): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const maybeTs = value as Partial<Timestamp> & { toDate?: () => Date };
  if (typeof maybeTs?.toDate === "function") {
    try {
      return maybeTs.toDate();
    } catch {
      // fall through
    }
  }
  return new Date();
};

const deserialize = (id: string, data: FirestoreAttempt): KunoQuizAttempt => ({
  id,
  userId: data.userId,
  moduleId: data.moduleId,
  lessonId: data.lessonId,
  quizTopicKey: data.quizTopicKey ?? null,
  locked: Boolean(data.locked),
  score: Number.isFinite(data.score) ? Number(data.score) : 0,
  answers: (data.answers ?? []).map((answer) => ({
    questionId: answer.questionId,
    answer: answer.answer,
    isCorrect: Boolean(answer.isCorrect),
    locked: answer.locked !== false,
    submittedAt: toDate(answer.submittedAt),
  })),
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt),
});

async function resolveUserId(ownerId?: string | null, strict = false): Promise<string | null> {
  if (ownerId) return ownerId;
  const authUser = await ensureAuth();
  if (authUser?.uid) return authUser.uid;
  if (strict) {
    throw new Error("Authentication required.");
  }
  return null;
}

export async function getKunoQuizAttempt(
  moduleId: string,
  lessonId: string,
  ownerId?: string | null,
): Promise<KunoQuizAttempt | null> {
  const userId = await resolveUserId(ownerId);
  if (!userId) return null;
  const ref = doc(getDb(), COLLECTION, buildDocId(userId, lessonId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return deserialize(snap.id, snap.data() as FirestoreAttempt);
}

export async function lockKunoQuizAnswers(payload: LockQuizPayload, ownerId?: string | null): Promise<KunoQuizAttempt> {
  const userId = await resolveUserId(ownerId, true);
  if (!userId) {
    throw new Error("User must be authenticated to lock quiz answers.");
  }
  if (areWritesDisabled()) {
    const existing = await getKunoQuizAttempt(payload.moduleId, payload.lessonId, ownerId);
    if (existing) return existing;
    throw new Error("Replay writes are disabled.");
  }
  const db = getDb();
  const ref = doc(db, COLLECTION, buildDocId(userId, payload.lessonId));
  let lockedAttempt: KunoQuizAttempt | null = null;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      const data = snap.data() as FirestoreAttempt;
      if (data.locked) {
        lockedAttempt = deserialize(snap.id, data);
        return;
      }
    }
    const now = serverTimestamp();
    tx.set(
      ref,
      {
        userId,
        moduleId: payload.moduleId,
        lessonId: payload.lessonId,
        quizTopicKey: payload.quizTopicKey ?? null,
        locked: true,
        score: Math.max(0, Math.min(100, Math.round(payload.score))),
        answers: payload.answers.map((answer) => ({
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect: Boolean(answer.isCorrect),
          locked: true,
          submittedAt: now,
        })),
        createdAt: now,
        updatedAt: now,
      },
      { merge: false },
    );
  });
  if (lockedAttempt) return lockedAttempt;
  const attempt = await getKunoQuizAttempt(payload.moduleId, payload.lessonId, ownerId);
  if (!attempt) {
    throw new Error("Unable to load quiz attempt after locking.");
  }
  return attempt;
}
