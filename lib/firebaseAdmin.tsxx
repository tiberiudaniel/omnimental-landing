import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let appInitialized = false;

function initFirebaseAdmin() {
  if (appInitialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
    );
  }

  // În .env private key este de obicei cu \\n – le transformăm în newline reale
  privateKey = privateKey.replace(/\\n/g, "\n");

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  appInitialized = true;
}

export function getAdminAuth() {
  initFirebaseAdmin();
  return getAuth();
}

export function getAdminDb() {
  initFirebaseAdmin();
  return getFirestore();
}
