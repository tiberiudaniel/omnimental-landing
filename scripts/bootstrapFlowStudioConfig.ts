import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebaseAdmin";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const rawAdmins = process.env.FLOW_STUDIO_ADMINS;
  if (!rawAdmins) {
    console.error("[bootstrapFlowStudio] Missing FLOW_STUDIO_ADMINS env (comma separated emails)");
    process.exit(1);
  }
  const admins = rawAdmins
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (!admins.length) {
    console.error("[bootstrapFlowStudio] No valid admins parsed from FLOW_STUDIO_ADMINS");
    process.exit(1);
  }
  const timezone = process.env.FLOW_STUDIO_TIMEZONE ?? "Europe/Bucharest";
  const db = getAdminDb();
  const docRef = db.collection("adminConfig").doc("flowStudio");
  const snapshot = await docRef.get();
  const payload = {
    enabled: true,
    admins,
    timezone,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!snapshot.exists) {
    Object.assign(payload, { createdAt: FieldValue.serverTimestamp() });
  }
  await docRef.set(payload, { merge: true });
  console.log(`[bootstrapFlowStudio] Config updated with ${admins.length} admins (timezone ${timezone}).`);
}

main().catch((error) => {
  console.error("[bootstrapFlowStudio] failed", error);
  process.exit(1);
});
