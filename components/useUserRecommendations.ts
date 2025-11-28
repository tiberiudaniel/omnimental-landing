"use client";

import { useEffect, useMemo, useState } from "react";
import type { OmniRecommendation } from "@/lib/recommendations";
import { sortRecommendations } from "@/lib/recommendations";
import { useProfile } from "@/components/ProfileProvider";
import { collection, onSnapshot, orderBy, query, type FirestoreError } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged, type Auth } from "firebase/auth";

interface UseUserRecommendationsState {
  recommendations: OmniRecommendation[];
  loading: boolean;
  error: FirestoreError | null;
}

export function useUserRecommendations(): UseUserRecommendationsState {
  const { profile } = useProfile();
  const auth = (typeof window !== "undefined" ? getFirebaseAuth() : null) as Auth | null;
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(() => auth?.currentUser?.uid ?? null);

  useEffect(() => {
    if (!auth) return undefined;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUserId(user?.uid ?? null);
    });
    return () => unsubAuth();
  }, [auth]);

  const userId = profile?.id ?? firebaseUserId;

  const [state, setState] = useState<UseUserRecommendationsState>({
    recommendations: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      return undefined;
    }
    const db = getDb();
    const colRef = collection(db, "userRecommendations", userId, "items");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: OmniRecommendation[] = snap.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          return {
            id: doc.id,
            userId,
            title: String(data.title ?? ""),
            shortLabel: String((data.shortLabel ?? data.title ?? "") as string),
            type: (data.type as OmniRecommendation["type"]) ?? "next-step",
            status: (data.status as OmniRecommendation["status"]) ?? "new",
            priority: ([1, 2, 3].includes(Number(data.priority)) ? Number(data.priority) : 2) as 1 | 2 | 3,
            createdAt: String(data.createdAt ?? new Date().toISOString()),
            updatedAt: (data.updatedAt as string | undefined) ?? undefined,
            estimatedMinutes: (data.estimatedMinutes as number | undefined) ?? undefined,
            tags: (Array.isArray(data.tags) ? (data.tags as string[]) : []) ?? [],
            body: String(data.body ?? ""),
            ctaLabel: (data.ctaLabel as string | undefined) ?? undefined,
            ctaHref: (data.ctaHref as string | undefined) ?? undefined,
            source: (data.source as "system" | "onboarding" | "coach" | "self" | undefined) ?? undefined,
            sourceRef: (data.sourceRef as string | undefined) ?? undefined,
          };
        });
        setState({ recommendations: sortRecommendations(items), loading: false, error: null });
      },
      (error) => {
        if (error.code === "permission-denied") {
          console.warn("[useUserRecommendations] Missing Firestore permissions, returning empty list.");
          setState({ recommendations: [], loading: false, error });
          return;
        }
        console.error("[useUserRecommendations] onSnapshot error", error);
        setState({ recommendations: [], loading: false, error });
      },
    );
    return () => unsub();
  }, [userId]);

  const sorted = useMemo(() => sortRecommendations(state.recommendations), [state.recommendations]);
  if (!userId) {
    return { recommendations: [], loading: false, error: null };
  }
  return { recommendations: sorted, loading: state.loading, error: state.error };
}
