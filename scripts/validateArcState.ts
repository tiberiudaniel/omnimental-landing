import "dotenv/config";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { ArcState } from "@/types/arcState";
import type { UserMetrics } from "@/types/userMetrics";
import { arcs } from "@/config/arcs/arcs";

const userId = process.env.TEST_USER_ID;

if (!userId) {
  console.error("Missing TEST_USER_ID in env.");
  process.exit(1);
}

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

initializeApp(
  serviceAccount
    ? {
        credential: cert(serviceAccount),
      }
    : {
        credential: applicationDefault(),
      },
);

const db = getFirestore();

async function main() {
  const snap = await db.collection("userProfiles").doc(userId).get();
  if (!snap.exists) {
    console.error(`No userProfile for ${userId}`);
    process.exit(1);
  }

  const data = snap.data() || {};
  const arcState = data.arcState as ArcState | undefined;
  const metrics = data.metrics as UserMetrics | undefined;

  console.log("ArcState:", JSON.stringify(arcState, null, 2));
  console.log("Metrics:", JSON.stringify(metrics, null, 2));

  const errors: string[] = [];

  if (!arcState?.current) {
    errors.push("arcState.current is missing");
  } else {
    const arc = arcs.find((a) => a.id === arcState.current?.id);
    if (!arc) {
      errors.push(`currentArc.id=${arcState.current.id} not found in config/arcs`);
    }
    if (!arcState.current.startedAt) {
      errors.push("currentArc.startedAt missing");
    }
    if (!["active", "completed"].includes(arcState.current.status)) {
      errors.push(`currentArc.status invalid: ${arcState.current.status}`);
    }
  }

  if (arcState?.progress) {
    for (const [arcId, p] of Object.entries(arcState.progress)) {
      if (p.daysCompleted < 0) errors.push(`progress[${arcId}].daysCompleted negative`);
      if (p.xp < 0) errors.push(`progress[${arcId}].xp negative`);
    }
  }

  if (metrics) {
    if (metrics.streakDays < 0) errors.push("metrics.streakDays negative");
    if (metrics.longestStreakDays < 0) errors.push("metrics.longestStreakDays negative");
  }

  if (errors.length === 0) {
    console.log("✅ ArcState & Metrics look consistent.");
  } else {
    console.error("❌ Issues found:");
    for (const error of errors) {
      console.error(" -", error);
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
