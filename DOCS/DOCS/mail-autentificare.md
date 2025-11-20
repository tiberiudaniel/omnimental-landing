Mai jos îți dau direct codul necesar pentru:

lib/firebaseAdmin.ts – helper pentru Firebase Admin (server-side).

app/api/auth/request-code/route.ts – trimite codul pe email (OTP).

app/api/auth/verify-code/route.ts – validează codul și întoarce customToken.

Noua versiune pentru app/auth/page.tsx (fișierul tău page.tsx) – UI cu:

„Continuă cu Google”

„Continuă cu email + cod”

„Continuă cu email + parolă”

păstrăm suportul pentru Magic Link deja configurat (când userul vine dintr-un link Firebase).

Poți copia–lipi direct, iar Codex poate ajusta detaliile.

1) lib/firebaseAdmin.ts

Creează fișier nou:

lib/firebaseAdmin.ts

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

Env necesare (.env.local / Vercel)

Trebuie să ai:

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"


FIREBASE_PRIVATE_KEY trebuie pus cu \n în loc de newline, de ex.:

FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXX\nYYYY\n-----END PRIVATE KEY-----\n"

2) OTP: /app/api/auth/request-code/route.ts

Trimite codul pe email. Pentru început, îl logăm în server console (bun pentru dev). Ulterior, schimbi sendOtpEmail să folosească providerul tău real (SMTP, Resend, SendGrid etc.).

app/api/auth/request-code/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebaseAdmin";

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minute

function generateOtpCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

async function sendOtpEmail(to: string, code: string) {
  // TODO: Înlocuiește asta cu integrarea reală (SMTP / Resend / SendGrid etc.)
  console.log(`[OTP] Cod pentru ${to}: ${code}`);
  // Exemplu (pseudocod):
  // await emailClient.send({
  //   to,
  //   subject: "Codul tău de acces OmniMental",
  //   text: `Codul tău de acces este: ${code} (valabil 15 minute).`,
  // });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email as string | undefined)?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalid." }, { status: 400 });
    }

    const db = getAdminDb();
    const code = generateOtpCode();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const now = Date.now();
    const expiresAt = now + OTP_TTL_MS;

    // Stocăm codul
    await db.collection("emailOtps").add({
      email,
      codeHash,
      createdAt: now,
      expiresAt,
      attempts: 0,
      used: false,
    });

    await sendOtpEmail(email, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("request-code error", err);
    return NextResponse.json(
      { error: "Eroare la generarea codului." },
      { status: 500 }
    );
  }
}

3) OTP: /app/api/auth/verify-code/route.ts

Validează codul, creează/recuperează userul în Firebase Auth și întoarce customToken.

app/api/auth/verify-code/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email as string | undefined)?.trim().toLowerCase();
    const code = (body.code as string | undefined)?.trim();

    if (!email || !email.includes("@") || !code || code.length < 4) {
      return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    }

    const db = getAdminDb();
    const auth = getAdminAuth();
    const now = Date.now();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    // Luăm cel mai recent OTP nefolosit pentru email
    const snap = await db
      .collection("emailOtps")
      .where("email", "==", email)
      .where("used", "==", false)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "Cod invalid sau expirat." },
        { status: 400 }
      );
    }

    const doc = snap.docs[0];
    const data = doc.data() as {
      codeHash: string;
      expiresAt: number;
      attempts?: number;
    };

    // Expirat
    if (data.expiresAt < now) {
      await doc.ref.update({ used: true });
      return NextResponse.json(
        { error: "Codul a expirat. Cere unul nou." },
        { status: 400 }
      );
    }

    // Cod greșit
    if (data.codeHash !== codeHash) {
      const attempts = (data.attempts ?? 0) + 1;
      await doc.ref.update({ attempts });
      return NextResponse.json(
        { error: "Cod incorect." },
        { status: 400 }
      );
    }

    // Marcăm OTP ca folosit
    await doc.ref.update({ used: true });

    // Creăm sau recuperăm userul
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        user = await auth.createUser({ email });
      } else {
        console.error("getUserByEmail error", err);
        return NextResponse.json(
          { error: "Eroare la validarea utilizatorului." },
          { status: 500 }
        );
      }
    }

    const customToken = await auth.createCustomToken(user.uid);

    return NextResponse.json({ customToken });
  } catch (err) {
    console.error("verify-code error", err);
    return NextResponse.json(
      { error: "Eroare la verificarea codului." },
      { status: 500 }
    );
  }
}

4) Noua pagină de autentificare: app/auth/page.tsx

Acum refacem page.tsx astfel încât:

Păstrăm efectul care consumă Magic Link (când userul vine din link Firebase).

Adăugăm:

buton „Continuă cu Google”;

bloc pentru „email + cod” (OTP);

bloc mic pentru „email + parolă”.

Înlocuiește conținutul fișierului tău page.tsx cu:

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import Toast from "@/components/Toast";

const AUTH_EMAIL_STORAGE_KEY = "omnimental_auth_email";
const KEEP_SIGNED_IN_KEY = "omnimental_keep_signed_in_until";
const KEEP_SIGNED_IN_DURATION_MS = 10 * 24 * 60 * 60 * 1000;

type LinkStatus = "idle" | "checking" | "signing" | "ok" | "error";

function AuthContent() {
  const router = useRouter();
  const search = useSearchParams();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);

  const [linkStatus, setLinkStatus] = useState<LinkStatus>("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email + cod (OTP)
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Email + parolă
  const [pwdEmail, setPwdEmail] = useState("");
  const [pwdPassword, setPwdPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMode, setPwdMode] = useState<"login" | "register">("login");

  const linkUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.href : ""),
    []
  );

  const isRo = typeof navigator !== "undefined" && navigator.language?.startsWith("ro");

  // 1) Consumăm Magic Link, dacă userul vine din email Firebase
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (typeof window === "undefined") return;
    const href = window.location.href;

    if (!isSignInWithEmailLink(auth, href)) {
      setLinkStatus("idle");
      return;
    }

    setLinkStatus("checking");

    const stored = (() => {
      try {
        const raw = window.localStorage.getItem(AUTH_EMAIL_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as { email?: string; remember?: boolean }) : null;
      } catch {
        return null;
      }
    })();
    const emailFromUrl = search?.get("auth_email");
    const email = (emailFromUrl || stored?.email || "").trim();
    if (!email) {
      setLinkStatus("error");
      return;
    }

    void signInWithEmailLink(auth, email, href)
      .then(() => {
        try {
          window.localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
          if (stored?.remember) {
            const expires = Date.now() + KEEP_SIGNED_IN_DURATION_MS;
            window.localStorage.setItem(KEEP_SIGNED_IN_KEY, String(expires));
          } else {
            window.localStorage.removeItem(KEEP_SIGNED_IN_KEY);
          }
        } catch {}

        // Curățăm URL
        try {
          const clean = new URL(window.location.origin + window.location.pathname);
          window.history.replaceState({}, document.title, clean.toString());
        } catch {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        setLinkStatus("ok");
        setToastMessage(
          isRo
            ? "Te-ai autentificat cu succes. Redirecționez spre Progres…"
            : "Signed in successfully. Redirecting to Progress…"
        );
        setTimeout(() => router.push("/progress"), 800);
      })
      .catch((err: unknown) => {
        try {
          window.localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
        } catch {}

        const code = (err as { code?: string })?.code ?? "";
        const isInvalid = /invalid-action-code/i.test(code);
        const ro = isInvalid
          ? "Link-ul este invalid sau expirat. Te rog cere unul nou."
          : "Nu am putut valida linkul.";
        const en = isInvalid
          ? "The link is invalid or expired. Please request a new one."
          : "Could not validate the link.";

        const msg = isRo ? ro : en;
        setErrorMessage(msg);
        setToastMessage(msg);
        setLinkStatus("error");

        try {
          const clean = new URL(window.location.origin + window.location.pathname);
          window.history.replaceState({}, document.title, clean.toString());
        } catch {
          // ignore
        }
      });
  }, [router, search, isRo]);

  // 2) Google sign-in
  const handleGoogleSignIn = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/progress");
    } catch (err: unknown) {
      console.error("Google sign-in error", err);
      const msg = isRo ? "Nu am putut face autentificarea cu Google." : "Google sign-in failed.";
      setToastMessage(msg);
    }
  };

  // 3) Email + cod (OTP)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) return;

    setOtpSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = (data?.error as string) || "Eroare la trimiterea codului.";
        setErrorMessage(msg);
        setToastMessage(msg);
      } else {
        setOtpSent(true);
        const msg = isRo
          ? "Ți-am trimis un cod pe email. Îl poți citi de pe orice device și îl introduci aici."
          : "We sent you a code by email. You can read it on any device and type it here.";
        setToastMessage(msg);
      }
    } catch (err) {
      console.error("send OTP error", err);
      const msg = isRo ? "Nu am putut trimite codul." : "Could not send the code.";
      setErrorMessage(msg);
      setToastMessage(msg);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim() || !otpCode.trim()) return;

    setOtpVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpEmail.trim(),
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.customToken) {
        const msg = (data?.error as string) || "Cod invalid.";
        setErrorMessage(msg);
        setToastMessage(msg);
        setOtpVerifying(false);
        return;
      }

      const auth = getFirebaseAuth();
      await signInWithCustomToken(auth, data.customToken);

      setToastMessage(
        isRo
          ? "Te-ai autentificat cu succes. Te duc la Progres…"
          : "Signed in successfully. Redirecting to Progress…"
      );
      setTimeout(() => router.push("/progress"), 800);
    } catch (err) {
      console.error("verify OTP error", err);
      const msg = isRo ? "Nu am putut verifica codul." : "Could not verify the code.";
      setErrorMessage(msg);
      setToastMessage(msg);
    } finally {
      setOtpVerifying(false);
    }
  };

  // 4) Email + parolă
  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdEmail.trim() || !pwdPassword.trim()) return;

    const auth = getFirebaseAuth();
    setPwdLoading(true);
    setErrorMessage(null);

    try {
      if (pwdMode === "login") {
        await signInWithEmailAndPassword(auth, pwdEmail.trim(), pwdPassword);
      } else {
        await createUserWithEmailAndPassword(auth, pwdEmail.trim(), pwdPassword);
      }
      router.push("/progress");
    } catch (err: any) {
      console.error("email+password error", err);
      const code = err?.code as string | undefined;
      let msg =
        isRo ? "Nu am putut face autentificarea." : "Email/password sign-in failed.";

      if (code === "auth/user-not-found" && pwdMode === "login") {
        msg = isRo
          ? "Nu există un cont cu acest email. Poți încerca să creezi unul."
          : "No account with this email. Try registering.";
      }
      if (code === "auth/email-already-in-use" && pwdMode === "register") {
        msg = isRo
          ? "Există deja un cont cu acest email. Încearcă să te autentifici."
          : "Account already exists. Try logging in.";
      }

      setErrorMessage(msg);
      setToastMessage(msg);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader
        showMenu
        onMenuToggle={() => setMenuOpen(true)}
        onAuthRequest={() => {
          /* noop */
        }}
      />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <main className="mx-auto max-w-md px-4 py-12">
        <section className="space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 text-center shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
          <h1 className="text-xl font-semibold text-[#1F1F1F]">
            {isRo ? "Autentificare OmniMental" : "OmniMental Sign-in"}
          </h1>

          {/* Status pentru Magic Link (dacă vine din email Firebase) */}
          {linkStatus === "checking" && (
            <p className="text-xs text-[#4A3A30]">
              {isRo ? "Verific linkul de autentificare…" : "Checking sign-in link…"}
            </p>
          )}
          {linkStatus === "ok" && (
            <p className="text-xs text-emerald-700">
              {isRo ? "Gata. Te redirecționez spre progres…" : "Done. Redirecting to Progress…"}
            </p>
          )}

          {errorMessage && (
            <p className="text-xs text-[#8C2B2F] text-left">{errorMessage}</p>
          )}

          {/* 1) Google */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-sm font-semibold text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
            >
              <span>G</span>
              <span>
                {isRo ? "Continuă cu Google" : "Continue with Google"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#A08C7A]">
            <span className="h-px flex-1 bg-[#E4D8CE]" />
            <span>{isRo ? "sau" : "or"}</span>
            <span className="h-px flex-1 bg-[#E4D8CE]" />
          </div>

          {/* 2) Email + cod (OTP) */}
          <div className="space-y-2 text-left">
            <p className="text-xs text-[#4A3A30]">
              {isRo
                ? "Introdu emailul. Îți trimitem un cod pe email, pe care îl poți citi de pe orice device și îl introduci aici."
                : "Enter your email. We’ll send you a code you can read on any device and type here."}
            </p>
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-2">
              <input
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                required
                placeholder="email@exemplu.com"
                className="w-full rounded-[10px] border border-[#E4D8CE] px-3 py-2 text-sm"
              />
              {otpSent && (
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  placeholder={isRo ? "Cod din email (6 cifre)" : "Code from email (6 digits)"}
                  className="w-full rounded-[10px] border border-[#E4D8CE] px-3 py-2 text-sm"
                />
              )}

              <button
                type="submit"
                disabled={otpSending || otpVerifying}
                className="w-full rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:opacity-60"
              >
                {otpSent
                  ? otpVerifying
                    ? isRo
                      ? "Verific codul…"
                      : "Verifying code…"
                    : isRo
                    ? "Confirmă codul"
                    : "Confirm code"
                  : otpSending
                  ? isRo
                    ? "Trimit codul…"
                    : "Sending code…"
                  : isRo
                  ? "Trimite cod pe email"
                  : "Send code to email"}
              </button>
            </form>
          </div>

          {/* 3) Email + parolă (opțional, mai mic) */}
          <div className="space-y-2 border-t border-[#F0E4D9] pt-4 text-left">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#4A3A30]">
                {isRo
                  ? "Preferi o parolă clasică?"
                  : "Prefer a classic password?"}
              </p>
              <button
                type="button"
                onClick={() =>
                  setPwdMode((m) => (m === "login" ? "register" : "login"))
                }
                className="text-[11px] font-semibold text-[#2C2C2C] underline"
              >
                {pwdMode === "login"
                  ? isRo
                    ? "Crează cont"
                    : "Create account"
                  : isRo
                  ? "Autentificare"
                  : "Log in"}
              </button>
            </div>

            <form onSubmit={handleEmailPassword} className="space-y-2">
              <input
                type="email"
                value={pwdEmail}
                onChange={(e) => setPwdEmail(e.target.value)}
                placeholder="email@exemplu.com"
                className="w-full rounded-[10px] border border-[#E4D8CE] px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={pwdPassword}
                onChange={(e) => setPwdPassword(e.target.value)}
                placeholder={isRo ? "Parolă" : "Password"}
                className="w-full rounded-[10px] border border-[#E4D8CE] px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full rounded-[10px] border border-[#A08C7A] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7A6455] hover:bg-[#A08C7A] hover:text-white disabled:opacity-60"
              >
                {pwdLoading
                  ? isRo
                    ? "Se conectează…"
                    : "Signing in…"
                  : pwdMode === "login"
                  ? isRo
                    ? "Autentificare email + parolă"
                    : "Sign in with email + password"
                  : isRo
                  ? "Crează cont cu email + parolă"
                  : "Create account with email + password"}
              </button>
            </form>
          </div>

          <p className="text-[10px] text-[#7A6455]">
            {isRo ? (
              <>
                Dacă ai un link vechi de autentificare primit pe email, îl poți
                folosi în continuare. Când îl deschizi, te vom redirecționa
                automat aici.
              </>
            ) : (
              <>
                If you still have an older sign-in link by email, you can use it.
                Opening it will automatically redirect you here.
              </>
            )}
          </p>

          <p className="text-[10px] text-[#7A6455]">
            <Link href="/" className="underline">
              {isRo ? "Înapoi la pagina principală" : "Back to home"}
            </Link>
          </p>
        </section>

        {toastMessage ? (
          <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-md px-4">
            <Toast message={toastMessage} okLabel="OK" onClose={() => setToastMessage(null)} />
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}

Ce urmează practic

Adaugă lib/firebaseAdmin.ts.

Adaugă cele două route-uri:

app/api/auth/request-code/route.ts

app/api/auth/verify-code/route.ts

Înlocuiește app/auth/page.tsx (fișierul tău page.tsx) cu versiunea de mai sus.

Verifică .env.local să conțină variabilele pentru Firebase Admin.

Pentru început, testezi local:

Email + cod – vezi codul în terminal (log).

Îl copiezi în formular și vezi dacă te duce la /progress.

Google sign-in – verifici flow complet.

Email + parolă – creezi un cont de test.

Când vrei, putem face și integrarea reală de email (SMTP / Resend / SendGrid) în sendOtpEmail, ca să nu mai depinzi de Magic Link deloc.