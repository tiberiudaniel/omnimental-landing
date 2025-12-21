import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let appInitialized = false;

function initFirebaseAdmin() {
  if (appInitialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;

  // Prefer Application Default Credentials when GOOGLE_APPLICATION_CREDENTIALS is set
  // (points to a service-account JSON file). This avoids PEM/newline issues in env vars.
  const useADC = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (!projectId) {
    throw new Error("Missing Firebase Admin environment variable FIREBASE_PROJECT_ID.");
  }

  if (!getApps().length) {
    if (useADC) {
      initializeApp({
        credential: applicationDefault(),
        projectId,
      });
    } else {
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!clientEmail || !privateKey) {
        throw new Error(
          "Missing Firebase Admin environment variables. Provide either GOOGLE_APPLICATION_CREDENTIALS (recommended) or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY."
        );
      }

      // In .env private key is often stored with \\n – convert to real newlines
      privateKey = privateKey.replace(/\\n/g, "\n");

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    }
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
