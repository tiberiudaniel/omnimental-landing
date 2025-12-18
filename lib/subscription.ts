import { doc, setDoc } from "firebase/firestore";
import { getDb, areWritesDisabled } from "@/lib/firebase";

export async function startPremiumMock(userId: string): Promise<void> {
  if (!userId || areWritesDisabled()) return;
  const db = getDb();
  const ref = doc(db, "userProfiles", userId);
  await setDoc(
    ref,
    {
      subscription: {
        status: "premium",
        provider: "manual",
        currentPeriodEnd: null,
      },
      isPremium: true,
      stripeSubscriptionStatus: "premium",
    },
    { merge: true },
  );
}
