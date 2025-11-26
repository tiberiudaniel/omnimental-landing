"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInAnonymously,
  type Auth,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function assertEnv(v: string | undefined, name: string) {
  if (!v || v === "undefined") {
    throw new Error(`Missing env ${name}. Set it in .env.local`);
  }
}

assertEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "NEXT_PUBLIC_FIREBASE_API_KEY");
assertEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
assertEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "NEXT_PUBLIC_FIREBASE_PROJECT_ID");
assertEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
assertEnv(
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
);
assertEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "NEXT_PUBLIC_FIREBASE_APP_ID");

if (typeof window !== "undefined" && (process.env.NEXT_PUBLIC_DEBUG === "1")) {
  console.log(
    "FB cfg",
    (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").slice(0, 6) + "...",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}

export function getFirebaseApp() {
  if (!getApps().length) return initializeApp(firebaseConfig);
  return getApp();
}

export function getDb() {
  return getFirestore(getFirebaseApp());
}

export function areWritesDisabled(): boolean {
  try {
    const flag = (process.env.NEXT_PUBLIC_DISABLE_PROGRESS_WRITES || "").toLowerCase();
    return flag === "1" || flag === "true" || flag === "yes";
  } catch {
    return false;
  }
}

let authInstance: Auth | null = null;

export function getFirebaseAuth() {
  if (authInstance) return authInstance;
  const auth = getAuth(getFirebaseApp());
  if (typeof window !== "undefined") {
    void setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Auth persistence setup failed", err);
    });
  }
  authInstance = auth;
  return auth;
}

// ensureAuth guarantees a Firebase user (anonymous or full) exists before writes.
export async function ensureAuth() {
  if (typeof window === "undefined") return null;
  const auth = getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser;
  try {
    await signInAnonymously(auth);
    return auth.currentUser ?? null;
  } catch (err: unknown) {
    // Handle cases where anonymous sign-in is disabled in Firebase console
    const code = (err as { code?: string })?.code ?? "";
    if (code === "auth/admin-restricted-operation") {
      console.warn("Anonymous auth disabled by project policy; proceeding unauthenticated");
      return null;
    }
    console.warn("ensureAuth failed", err);
    return null;
  }
}

export function onAuthReady(cb: (uid: string) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (u) => { if (u) cb(u.uid); });
}
// === ensure auto anonymous auth ===
if (typeof window !== "undefined") {
  // Optional: allow silencing noisy Firestore logs during development
  try {
    const lvl = (process.env.NEXT_PUBLIC_FIREBASE_LOG_LEVEL || "").toLowerCase();
    if (lvl === "error" || lvl === "silent") {
      // valid values: 'debug' | 'error' | 'silent'
      setLogLevel(lvl as "debug" | "error" | "silent");
    }
  } catch {}
  const auth = getFirebaseAuth();
  let anonTimer: number | null = null;
  onAuthStateChanged(auth, (user) => {
    // If a real user is present, clear any pending anon timer
    if (user) {
      try {
        if (user.isAnonymous) {
          window.localStorage.setItem('OMNI_LAST_ANON_UID', user.uid);
        }
      } catch {}
      if (anonTimer) {
        try { window.clearTimeout(anonTimer); } catch {}
        anonTimer = null;
      }
      console.log("Signed in as:", user.uid);
      return;
    }
    // Avoid racing against magic-link consumption: if URL still contains oobCode, skip anon sign-in
    try {
      const href = window.location.href;
      if (href.includes("oobCode=") || href.includes("mode=signIn")) {
        return;
      }
    } catch {}
    // Delay a bit to allow persisted sessions to hydrate before creating a fresh anonymous user
    if (anonTimer) {
      try { window.clearTimeout(anonTimer); } catch {}
    }
    anonTimer = window.setTimeout(() => {
      if (!auth.currentUser) {
        signInAnonymously(auth).catch((err) => {
          console.error("Anonymous sign-in failed:", err);
        });
      }
    }, 1200) as unknown as number;
  });
}
