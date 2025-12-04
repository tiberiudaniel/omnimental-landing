"use client";

import { Suspense, useEffect, useState } from "react";
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
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import Toast from "@/components/Toast";

const AUTH_EMAIL_STORAGE_KEY = "omnimental_auth_email";
const KEEP_SIGNED_IN_KEY = "omnimental_keep_signed_in_until";
const KEEP_SIGNED_IN_DURATION_MS = 10 * 24 * 60 * 60 * 1000;

function AuthContent() {
  const router = useRouter();
  const search = useSearchParams();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email + cod
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

  const isRo = typeof navigator !== "undefined" && navigator.language?.startsWith("ro");

  // Consumă în fundal Magic Link, dar fără să expunem UI-ul vechi
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (typeof window === "undefined") return;
    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) return;

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
    if (!email) return;

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

        try {
          const clean = new URL(window.location.origin + window.location.pathname);
          window.history.replaceState({}, document.title, clean.toString());
        } catch {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const msg = isRo
          ? "Te-ai autentificat cu succes. Redirecționez spre Progres…"
          : "Signed in successfully. Redirecting to Progress…";
        setToastMessage(msg);
        setTimeout(() => router.push("/progress"), 800);
      })
      .catch((err: unknown) => {
        try {
          window.localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
        } catch {}

        const code = (err as { code?: string })?.code ?? "";
        const isInvalid = /invalid-action-code/i.test(code);
        const ro = isInvalid
          ? "Codul de activare este invalid sau expirat. Cere unul nou."
          : "Nu am putut verifica solicitarea.";
        const en = isInvalid
          ? "The activation link is invalid or expired. Please request a new code."
          : "Could not complete the sign-in request.";
        const msg = isRo ? ro : en;
        setErrorMessage(msg);
        setToastMessage(msg);
        try {
          const clean = new URL(window.location.origin + window.location.pathname);
          window.history.replaceState({}, document.title, clean.toString());
        } catch {
          // ignore
        }
      });
  }, [router, search, isRo]);

  const [googleBusy, setGoogleBusy] = useState(false);

  const handleGoogleSignIn = async () => {
    if (googleBusy) return;
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      setGoogleBusy(true);
      await signInWithPopup(auth, provider);
      router.push("/progress");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      if (code !== "auth/cancelled-popup-request") {
        console.error("Google sign-in error", err);
        const msg = isRo ? "Nu am putut face autentificarea cu Google." : "Google sign-in failed.";
        setToastMessage(msg);
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleSendOtp = async (ev: React.FormEvent) => {
    ev.preventDefault();
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

  const handleVerifyOtp = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!otpEmail.trim() || !otpCode.trim()) return;
    setOtpVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail.trim(), code: otpCode.trim() }),
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
      const msg = isRo
        ? "Te-ai autentificat cu succes. Te duc la Progres…"
        : "Signed in successfully. Redirecting to Progress…";
      setToastMessage(msg);
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

  const handleEmailPassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
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
    } catch (error) {
      console.error("email+password error", error);
      const err = error as { code?: string };
      let msg = isRo ? "Nu am putut face autentificarea." : "Email/password sign-in failed.";
      if (err?.code === "auth/user-not-found" && pwdMode === "login") {
        msg = isRo
          ? "Nu există un cont cu acest email. Poți încerca să creezi unul."
          : "No account with this email. Try registering.";
      } else if (err?.code === "auth/email-already-in-use" && pwdMode === "register") {
        msg = isRo
          ? "Există deja un cont cu acest email. Încearcă Autentificare."
          : "Account already exists. Try logging in.";
      }
      setErrorMessage(msg);
      setToastMessage(msg);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      <AppShell header={<SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => {}} />}>
        <div className="mx-auto max-w-md px-4 py-12">
        <section className="space-y-4 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 text-center shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
          <h1 className="text-xl font-semibold text-[var(--omni-ink)]">
            {isRo ? "Autentificare" : "Sign in"}
          </h1>
          <p className="text-sm text-[var(--omni-ink-soft)]">
            {isRo
              ? "Alege metoda preferată pentru a intra în contul tău OmniMental."
              : "Choose how you want to access your OmniMental account."}
          </p>
          {errorMessage ? <p className="text-sm text-[var(--omni-danger)]">{errorMessage}</p> : null}

          <OmniCtaButton type="button" onClick={handleGoogleSignIn} disabled={googleBusy} variant="primary">
            {isRo ? "Continuă cu Google" : "Continue with Google"}
          </OmniCtaButton>

          <div className="space-y-2 border-t border-[#F0E4D9] pt-4 text-left">
            <p className="text-xs text-[var(--omni-ink-soft)]">
              {isRo ? "Email + cod (15 minute)" : "Email + code (15 minutes)"}
            </p>
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-2">
              <input
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="email@exemplu.com"
                className="w-full rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                required
              />
              {otpSent ? (
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder={isRo ? "Codul primit" : "Your code"}
                  className="w-full rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                  required
                />
              ) : null}
              <OmniCtaButton type="submit" disabled={otpSending || otpVerifying} variant="neutral">
                {otpSending
                  ? isRo
                    ? "Trimit codul…"
                    : "Sending code…"
                  : otpVerifying
                  ? isRo
                    ? "Verific codul…"
                    : "Verifying code…"
                  : otpSent
                  ? isRo
                    ? "Verifică codul"
                    : "Verify code"
                  : isRo
                  ? "Trimite codul"
                  : "Send code"}
              </OmniCtaButton>
            </form>
          </div>

          <div className="space-y-2 border-t border-[#F0E4D9] pt-4 text-left">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--omni-ink-soft)]">
                {isRo ? "Preferi o parolă clasică?" : "Prefer a classic password?"}
              </p>
              <button
                type="button"
                onClick={() => setPwdMode((mode) => (mode === "login" ? "register" : "login"))}
                className="text-[11px] font-semibold text-[var(--omni-ink)] underline"
              >
                {pwdMode === "login"
                  ? isRo
                    ? "Creează cont"
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
                className="w-full rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                autoComplete="email"
              />
              <input
                type="password"
                value={pwdPassword}
                onChange={(e) => setPwdPassword(e.target.value)}
                placeholder={isRo ? "Parolă" : "Password"}
                className="w-full rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                autoComplete="current-password"
              />
              <OmniCtaButton type="submit" disabled={pwdLoading} variant="primary">
                {pwdLoading
                  ? isRo
                    ? "Se conectează…"
                    : "Signing in…"
                  : pwdMode === "login"
                  ? isRo
                    ? "Autentificare email + parolă"
                    : "Sign in with email + password"
                  : isRo
                  ? "Creează cont cu email + parolă"
                  : "Create account with email + password"}
              </OmniCtaButton>
            </form>
          </div>

          <p className="text-[10px] text-[var(--omni-muted)]">
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
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}
