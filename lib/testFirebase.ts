// lib/testFirebase.ts
"use client";
import { getDb } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function testFirebase() {
  // basic safe test: do not run in production unless you know DB rules
  try {
    const db = getDb();
    const ref = collection(db, "healthcheck");
    await addDoc(ref, { ts: serverTimestamp(), ok: true });
    return true;
  } catch (e) {
    console.warn("Firebase test failed", e);
    throw e;
  }
}
