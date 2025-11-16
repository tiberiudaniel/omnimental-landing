"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
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
  const [emailInput, setEmailInput] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "checking" | "signing" | "ok" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // no user state needed here

  const linkUrl = useMemo(() => (typeof window !== "undefined" ? window.location.href : ""), []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (typeof window === "undefined") return;
    if (!isSignInWithEmailLink(auth, window.location.href)) return;
    // Try to auto-consume using stored or query email
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
    void signInWithEmailLink(auth, email, window.location.href)
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
        // Clean URL
        try {
          const clean = new URL(window.location.origin + window.location.pathname);
          window.history.replaceState({}, document.title, clean.toString());
        } catch {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        router.push("/progress");
      })
      .catch((err: unknown) => {
        try { window.localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY); } catch {}
        const code = (err as { code?: string })?.code ?? '';
        const isInvalid = /invalid-action-code/i.test(code);
        const ro = isInvalid ? 'Link-ul este invalid sau expirat. Te rog cere unul nou.' : 'Nu am putut valida linkul.';
        const en = isInvalid ? 'The link is invalid or expired. Please request a new one.' : 'Could not validate the link.';
        setErrorMessage(navigator.language?.startsWith('ro') ? ro : en);
        setToastMessage(navigator.language?.startsWith('ro') ? ro : en);
        setStatus('error');
        // Clean noisy params so the effect does not re-fire endlessly
        try {
          const clean = new URL(window.location.origin + window.location.pathname);
          window.history.replaceState({}, document.title, clean.toString());
        } catch {}
      });
  }, [router, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    if (typeof window === "undefined") return;
    const auth = getFirebaseAuth();
    setStatus("signing");
    try {
      await signInWithEmailLink(auth, emailInput.trim(), linkUrl);
      try {
        window.localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
      } catch {}
      setStatus("ok");
      setToastMessage(
        navigator.language?.startsWith("ro")
          ? "Te-ai autentificat cu succes. Redirecționez spre Progres…"
          : "Signed in successfully. Redirecting to Progress…",
      );
      setTimeout(() => router.push("/progress"), 800);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const msg = code || "sign-in failed";
      setErrorMessage(msg);
      setToastMessage(msg);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => { /* noop */ }} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-md px-4 py-12">
        <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 text-center shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
          <h1 className="text-xl font-semibold text-[#1F1F1F]">Autentificare cu link</h1>
          {status === "checking" && (
            <p className="text-sm text-[#4A3A30]">Verific linkul…</p>
          )}
          {status === "signing" && (
            <p className="text-sm text-[#4A3A30]">Se conectează…</p>
          )}
          {status === "ok" && (
            <p className="text-sm text-emerald-700">Gata. Te redirecționez spre progres…</p>
          )}
          {(status === "idle" || status === "error") && (
            <>
              <p className="text-sm text-[#4A3A30]">
                Introdu emailul folosit pentru autentificare și reconfirmă linkul.
              </p>
              <form onSubmit={handleSubmit} className="mx-auto mt-2 flex max-w-sm flex-col gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  placeholder="email@exemplu.com"
                  className="rounded-[10px] border border-[#E4D8CE] px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
                >
                  Confirmă emailul
                </button>
              </form>
              {errorMessage ? (
                <p className="text-xs text-[#8C2B2F]">{errorMessage}</p>
              ) : null}
              <p className="text-xs text-[#7A6455]">
                Nu ai linkul? <Link href="/" className="underline">Cere un link nou</Link>
              </p>
            </>
          )}
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
