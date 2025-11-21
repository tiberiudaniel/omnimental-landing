"use server";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { Resend } from "resend";

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtpCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

async function sendOtpEmail(to: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[OTP] Cod pentru ${to}: ${code}`);
    return;
  }

  const from =
    process.env.OTP_FROM_EMAIL || "OmniMental <no-reply@example.com>";

  const subject = "Codul tău de acces OmniMental";
  const text =
    `Codul tău de acces este: ${code} (valabil 15 minute).\n` +
    `Dacă nu tu ai cerut acest cod, poți ignora acest email.`;

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Resend OTP email error", err);
    console.log(`[OTP][FALLBACK] Cod pentru ${to}: ${code}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = rawEmail.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalid." }, { status: 400 });
    }

    const db = getAdminDb();
    const code = generateOtpCode();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const now = Date.now();
    const expiresAt = now + OTP_TTL_MS;

    await db.collection("emailOtps").add({
      email,
      codeHash,
      createdAt: now,
      expiresAt,
      expiresAtTs: new Date(expiresAt),
      attempts: 0,
      used: false,
    });

    await sendOtpEmail(email, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("request-code error", err);
    return NextResponse.json({ error: "Eroare la generarea codului." }, { status: 500 });
  }
}
