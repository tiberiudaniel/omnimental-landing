"use client";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type FirestoreError,
  type Timestamp,
} from "firebase/firestore";
import { getDb, ensureAuth, getFirebaseAuth } from "@/lib/firebase";

type EvaluationScores = {
  pssTotal: number;
  gseTotal: number;
  maasTotal: number;
  panasPositive: number;
  panasNegative: number;
  svs: number;
};

export type EvaluationTimelineEntry = {
  id: string;
  createdAt: Date | null;
  stage: string | null;
  scores: EvaluationScores;
};

type TimelineState = {
  entries: EvaluationTimelineEntry[];
  loading: boolean;
  error: FirestoreError | Error | null;
};

const initialState: TimelineState = {
  entries: [],
  loading: true,
  error: null,
};

export function useEvaluationTimeline() {
  const [state, setState] = useState<TimelineState>(initialState);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let canceled = false;

    const attachListener = async () => {
      try {
        const auth = getFirebaseAuth();
        let user = auth.currentUser;
        if (!user) {
          user = await ensureAuth();
        }
        if (!user) {
          if (!canceled) {
            setState({ entries: [], loading: false, error: null });
          }
          return;
        }
        const db = getDb();
        const q = query(
          collection(db, "userIntentSnapshots"),
          where("profileId", "==", user.uid),
          orderBy("timestamp", "asc"),
        );
        unsub = onSnapshot(
          q,
          (snapshot) => {
            if (canceled) return;
            const mapped = snapshot.docs
              .map((doc) => {
                const data = doc.data();
                const rawTimestamp =
                  (data.timestamp as Timestamp | undefined) ??
                  (data.createdAt as Timestamp | undefined);
                const answers = (data.answers ?? {}) as Record<string, unknown>;
                const scores = (answers.scores as EvaluationScores | undefined) ?? data.scores;
                if (!scores) return null;
                return {
                  id: doc.id,
                  createdAt: rawTimestamp?.toDate?.() ?? null,
                  stage: (answers.stage as string | undefined) ?? null,
                  scores,
                };
              })
              .filter((entry): entry is EvaluationTimelineEntry => Boolean(entry));
            setState({ entries: mapped, loading: false, error: null });
          },
          (error) => {
            if (canceled) return;
            setState({ entries: [], loading: false, error });
          },
        );
      } catch (error) {
        if (!canceled) {
          setState({ entries: [], loading: false, error: error as Error });
        }
      }
    };

    void attachListener();

    return () => {
      canceled = true;
      unsub?.();
    };
  }, []);

  return state;
}
