"use client";

import { doc, setDoc } from "firebase/firestore";
import { ensureAuth, getDb } from "./firebase";

export type Selection = "none" | "individual" | "group";

/**
 * Update the user's selection (none | individual | group) in their profile.
 * Best-effort; requires auth (anonymous is fine) and merges into userProfiles/{uid}.
 */
export async function updateProfileSelection(selection: Selection) {
  const user = await ensureAuth();
  if (!user) return;
  const ref = doc(getDb(), "userProfiles", user.uid);
  await setDoc(ref, { selection }, { merge: true });
}

