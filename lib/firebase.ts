// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAE3Wv-gWo2-aNUWZ_CFMHDhurbaD0ASPA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "omnimental-landing.vercel.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "omnimental-landing",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "omnimental-landing.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1012216607071",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1012216607071:web:334d21803fb409cee406ea",
};

export function getFirebaseApp() {
  // initialize once, safe in Next runtime
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getDb() {
  const app = getFirebaseApp();
  return getFirestore(app);
}

let authInstance: Auth | null = null;

export function getFirebaseAuth() {
  if (authInstance) {
    return authInstance;
  }
  const app = getFirebaseApp();
  const auth = getAuth(app);
  if (typeof window !== "undefined") {
    void setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Auth persistence setup failed", err);
    });
  }
  authInstance = auth;
  return auth;
}
