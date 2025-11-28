import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
