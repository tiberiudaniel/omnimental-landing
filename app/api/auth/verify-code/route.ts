"use server";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const rawCode = typeof body.code === "string" ? body.code : "";
    const email = rawEmail.trim().toLowerCase();
    const code = rawCode.trim();

    if (!email || !email.includes("@") || !code || code.length < 4) {
      return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    }

    const db = getAdminDb();
    const auth = getAdminAuth();
    const now = Date.now();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    const snap = await db
      .collection("emailOtps")
      .where("email", "==", email)
      .where("used", "==", false)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Cod invalid sau expirat." }, { status: 400 });
    }

    const doc = snap.docs[0];
    const data = doc.data() as {
      codeHash: string;
      expiresAt: number;
      attempts?: number;
    };

    if (data.expiresAt < now) {
      await doc.ref.update({ used: true });
      return NextResponse.json({ error: "Codul a expirat. Cere unul nou." }, { status: 400 });
    }

    if (data.codeHash !== codeHash) {
      const attempts = (data.attempts ?? 0) + 1;
      await doc.ref.update({ attempts });
      return NextResponse.json({ error: "Cod incorect." }, { status: 400 });
    }

    await doc.ref.update({ used: true });

    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code === "auth/user-not-found") {
        user = await auth.createUser({ email });
      } else {
        console.error("getUserByEmail error", error);
        return NextResponse.json({ error: "Eroare la validarea utilizatorului." }, { status: 500 });
      }
    }

    const customToken = await auth.createCustomToken(user.uid);
    return NextResponse.json({ customToken });
  } catch (err) {
    console.error("verify-code error", err);
    return NextResponse.json({ error: "Eroare la verificarea codului." }, { status: 500 });
  }
}

