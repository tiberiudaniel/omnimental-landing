#!/usr/bin/env node
// Minimal tool to set a custom claim { admin: true } on a Firebase Auth user.
// Usage:
//  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
//  node scripts/setAdminClaim.mjs --uid=UID
// or
//  node scripts/setAdminClaim.mjs --email=user@example.com

import admin from "firebase-admin";

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((p) => {
      const [k, v] = p.split("=");
      return [k.replace(/^--/, ""), v ?? "true"];
    }),
  );
  return args;
}

async function main() {
  const args = parseArgs();
  const { uid, email } = args;
  if (!uid && !email) {
    console.error("Provide --uid or --email");
    process.exit(1);
  }

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (e) {
      console.error("Failed to init firebase-admin. Ensure GOOGLE_APPLICATION_CREDENTIALS or ADC.", e);
      process.exit(1);
    }
  }

  const auth = admin.auth();
  let userRecord;
  if (email) userRecord = await auth.getUserByEmail(email);
  else userRecord = await auth.getUser(uid);

  await auth.setCustomUserClaims(userRecord.uid, { ...(userRecord.customClaims || {}), admin: true });
  console.log("Admin claim set on:", userRecord.uid);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

