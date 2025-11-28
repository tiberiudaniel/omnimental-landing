import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { OMNI_COLLECTIBLES, type OmniCollectible } from "@/config/omniCollectibles";

export type UnlockedCollectible = OmniCollectible;

const COLLECTION = "userCollectibles";

export async function maybeUnlockCollectiblesForLesson(userId: string, lessonId: string) {
  if (!userId || !lessonId) return [] as UnlockedCollectible[];
  const unlockables = OMNI_COLLECTIBLES.filter((entry) =>
    entry.unlockAfterLessonIds.includes(lessonId),
  );
  if (!unlockables.length) return [];
  const db = getDb();
  const unlocked: UnlockedCollectible[] = [];
  await Promise.all(
    unlockables.map(async (collectible) => {
      const docId = `${userId}_${collectible.id}`;
      const ref = doc(db, COLLECTION, docId);
      const snap = await getDoc(ref);
      if (snap.exists()) return;
      await setDoc(ref, {
        userId,
        collectibleId: collectible.id,
        arcId: collectible.arcId,
        unlockedAt: serverTimestamp(),
      });
      unlocked.push(collectible);
    }),
  );
  return unlocked;
}

export async function loadUserCollectibles(userId: string) {
  if (!userId) return [];
  const db = getDb();
  const ref = collection(db, COLLECTION);
  const q = query(ref, where("userId", "==", userId), orderBy("unlockedAt", "desc"));
  const snap = await getDocs(q);
  const unlockedIds = new Set<string>();
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const collectibleId = data.collectibleId as string | undefined;
    if (collectibleId) {
      unlockedIds.add(collectibleId);
    }
  });
  return OMNI_COLLECTIBLES.filter((entry) => unlockedIds.has(entry.id));
}
