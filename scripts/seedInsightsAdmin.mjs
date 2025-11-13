#!/usr/bin/env node
// Seed /insights/* documents using Firebase Admin SDK (admin-only writes).
// Usage:
//  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
//  node scripts/seedInsightsAdmin.mjs

import admin from "firebase-admin";

const data = {
  Calm: [
    "Respirația diafragmatică reduce activarea amigdalei în 2–3 minute și stabilizează sistemul nervos.",
    "Tensiunea musculară din umeri și abdomen este primul semn că sistemul nervos intră în modul 'fight-or-flight'.",
  ],
  Clarity: [
    "Atenția executivă scade după 90 de minute de lucru continuu; pauzele scurte cresc claritatea mentală.",
    "Mintea devine mai clară când limitele personale sunt respectate; confuzia vine adesea din supraîncărcare relațională.",
  ],
  Energy: [
    "Somnul profund stabilizează variabilitatea ritmului cardiac și susține energia pe tot parcursul zilei.",
    "Hidratarea adecvată îmbunătățește funcția cognitivă și reduce oboseala cu până la 20%.",
  ],
  Focus: [
    "Un set de 3 minute de respirație 4-4-6 îmbunătățește funcția cortexului prefrontal și controlul atențional.",
    "Distragerile nu dispar; învățăm doar să le ignorăm prin antrenament repetat al atenției.",
  ],
};

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  const db = admin.firestore();
  const batch = db.batch();
  Object.entries(data).forEach(([theme, items]) => {
    const ref = db.collection("insights").doc(theme);
    batch.set(ref, { items }, { merge: true });
  });
  await batch.commit();
  console.log("Seeded insights for themes:", Object.keys(data).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

