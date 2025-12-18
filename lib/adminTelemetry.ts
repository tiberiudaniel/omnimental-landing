"use client";

import { collectionGroup, getDocs, limit, orderBy, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export async function fetchRecentTelemetryUsers(take: number = 10): Promise<string[]> {
  try {
    const db = getDb();
    const groupRef = collectionGroup(db, "sessions");
    const q = query(groupRef, orderBy("recordedAt", "desc"), limit(take * 3));
    const snap = await getDocs(q);
    const ids: string[] = [];
    snap.forEach((docSnap) => {
      const parent = docSnap.ref.parent.parent;
      if (parent?.id) {
        ids.push(parent.id);
      }
    });
    const unique = Array.from(new Set(ids));
    return unique.slice(0, take);
  } catch (error) {
    console.warn("fetchRecentTelemetryUsers failed", error);
    return [];
  }
}
