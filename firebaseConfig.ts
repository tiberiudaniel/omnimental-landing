// firebaseConfig.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAE3Wv-gWo2-aNUWZ_CFMHDhurbaD0ASPA",
  authDomain: "omnimental-landing.firebaseapp.com",
  projectId: "omnimental-landing",
  storageBucket: "omnimental-landing.appspot.com",
  messagingSenderId: "1012216607071",
  appId: "1:1012216607071:web:334d21803fb409cee406ea",
  measurementId: "G-8YDSWH9EFN",
};

// Initialize Firebase app once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firestore instance for direct import
export const db = getFirestore(app);

// Optionally export app if other SDKs (auth, analytics) are used
export { app };
