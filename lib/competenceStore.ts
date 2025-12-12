import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { UserCompetence, CompetenceLevel } from "@/types/competence";

const COLLECTION = "userProfiles";

const DEFAULT_COMPETENCE: UserCompetence = {
  energy: "foundation",
  clarity: "foundation",
  flex: "foundation",
  executive: "foundation",
  adaptive: "foundation",
  shielding: "foundation",
  identity: "foundation",
};

export async function getUserCompetence(userId: string): Promise<UserCompetence> {
  if (!userId) return DEFAULT_COMPETENCE;
  const db = getDb();
  const ref = doc(db, COLLECTION, userId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, { competence: DEFAULT_COMPETENCE }, { merge: true });
    return DEFAULT_COMPETENCE;
  }
  const data = snapshot.data();
  if (!data.competence) {
    await setDoc(ref, { competence: DEFAULT_COMPETENCE }, { merge: true });
    return DEFAULT_COMPETENCE;
  }
  return { ...DEFAULT_COMPETENCE, ...(data.competence as Partial<UserCompetence>) };
}

export async function updateUserCompetence(
  userId: string,
  partialUpdate: Partial<UserCompetence>,
): Promise<void> {
  if (!userId) return;
  const db = getDb();
  const ref = doc(db, COLLECTION, userId);
  await setDoc(
    ref,
    {
      competence: partialUpdate,
    },
    { merge: true },
  );
}

export function getUserOverallLevel(competence: UserCompetence): CompetenceLevel {
  const values = Object.values(competence);
  const counts: Record<CompetenceLevel, number> = {
    foundation: 0,
    operational: 0,
    mastery: 0,
  };
  values.forEach((level) => {
    counts[level as CompetenceLevel] += 1;
  });
  if (counts.mastery >= 3) return "mastery";
  if (counts.operational >= 3) return "operational";
  return "foundation";
}
