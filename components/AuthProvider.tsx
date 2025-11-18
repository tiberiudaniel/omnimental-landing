"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "../lib/firebase";
import { migrateAnonToUser } from "@/lib/migrateUserData";

const AUTH_EMAIL_STORAGE_KEY = "omnimental_auth_email";
const KEEP_SIGNED_IN_KEY = "omnimental_keep_signed_in_until";
const KEEP_SIGNED_IN_DURATION_MS = 10 * 24 * 60 * 60 * 1000; // 10 days
const QUOTA_HOLD_KEY = "omnimental_auth_quota_hold_until";

type StoredAuthContext = {
  email: string;
  remember: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  sendingLink: boolean;
  linkSentTo?: string;
  sendMagicLink: (email: string, remember: boolean) => Promise<void>;
  signOutUser: () => Promise<void>;
  authNotice: { message: string } | null;
  clearAuthNotice: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | undefined>(undefined);
  const [authNotice, setAuthNotice] = useState<{ message: string } | null>(null);
  const pendingRememberRef = useRef<boolean>(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      // If we have a stored anonymous uid and now a real user, migrate data once
      try {
        if (typeof window !== 'undefined' && firebaseUser && !firebaseUser.isAnonymous) {
          const anon = window.localStorage.getItem('OMNI_LAST_ANON_UID');
          if (anon && anon !== firebaseUser.uid) {
            void migrateAnonToUser(anon, firebaseUser.uid)
              .then(() => {
                try { window.localStorage.removeItem('OMNI_LAST_ANON_UID'); } catch {}
              })
              .catch((e) => console.warn('migrateAnonToUser failed', e));
          }
        }
      } catch {}
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const auth = getFirebaseAuth();
    // Avoid double-consuming on the dedicated /auth page; let that page own the flow
    try {
      const path = window.location.pathname || '';
      if (path.startsWith('/auth')) return;
    } catch {}
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      return;
    }
    let stored: StoredAuthContext | null = null;
    const storedValue = window.localStorage.getItem(AUTH_EMAIL_STORAGE_KEY);
    if (storedValue) {
      try {
        stored = JSON.parse(storedValue) as StoredAuthContext;
      } catch (error) {
        console.warn("Failed to parse stored auth context", error);
      }
    }
    const url = new URL(window.location.href);
    const emailFromUrl = url.searchParams.get("auth_email");
    let email = emailFromUrl ?? stored?.email ?? null;
    if (!email) {
      const promptValue = window.prompt("Introduce emailul folosit pentru autentificare");
      email = promptValue ? promptValue.trim() : null;
    }
    if (email) {
      pendingRememberRef.current = stored?.remember ?? false;
      void signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
          if (pendingRememberRef.current) {
            const expires = Date.now() + KEEP_SIGNED_IN_DURATION_MS;
            window.localStorage.setItem(KEEP_SIGNED_IN_KEY, String(expires));
          } else {
            window.localStorage.removeItem(KEEP_SIGNED_IN_KEY);
          }
          // Clean up query params (remove auth_email and oob params)
          try {
            const clean = new URL(window.location.origin + window.location.pathname);
            window.history.replaceState({}, document.title, clean.toString());
          } catch {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch((error: unknown) => {
          const code = (error as { code?: string })?.code ?? "";
          console.error("Email link sign-in failed", error);
          if (typeof window !== "undefined" && code === "auth/invalid-action-code") {
            // Clear stored email to avoid loops. Toast is handled on /auth page.
            try { window.localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY); } catch {}
          }
        });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!user) {
      return;
    }
    const keepValue = window.localStorage.getItem(KEEP_SIGNED_IN_KEY);
    if (!keepValue) {
      return;
    }
    const expires = Number(keepValue);
    if (Number.isFinite(expires) && Date.now() > expires) {
      const auth = getFirebaseAuth();
      void signOut(auth).catch((error) => {
        console.error("Auto sign-out failed", error);
      });
    }
  }, [user]);

  const sendMagicLink = useCallback(async (email: string, remember: boolean) => {
    if (!email) {
      throw new Error("Email is required");
    }
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error("Email is required");
    }
    // Quota hold guard: if previous quota-exceeded set a hold, surface message and skip
    if (typeof window !== "undefined") {
      try {
        const hold = Number(window.localStorage.getItem(QUOTA_HOLD_KEY) || "0");
        if (Number.isFinite(hold) && Date.now() < hold) {
          const ro = "Ai atins limita zilnică pentru linkuri de autentificare. Te rugăm să încerci mai târziu sau să folosești modul oaspete.";
          const en = "Daily quota for sign-in links has been reached. Please try later or use guest mode.";
          setAuthNotice({ message: navigator.language?.startsWith("ro") ? ro : en });
          return;
        }
      } catch {}
    }
    setSendingLink(true);
    try {
      const auth = getFirebaseAuth();
      const base =
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_CONTINUE_URL ??
        (typeof window !== "undefined" ? window.location.origin : undefined) ??
        "http://localhost:3000";
      // Build continue URL to dedicated handler: /auth
      let continueUrl = base;
      try {
        const u = new URL(base);
        // If no explicit path, route to /auth
        if (!u.pathname || u.pathname === "/") {
          u.pathname = "/auth";
        }
        u.searchParams.set("auth_email", trimmed);
        continueUrl = u.toString();
      } catch {
        // best-effort fallback
        continueUrl = base.replace(/\/?$/, "/auth");
        try {
          const u = new URL(continueUrl);
          u.searchParams.set("auth_email", trimmed);
          continueUrl = u.toString();
        } catch {}
      }
      const actionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: true,
      } as const;
      await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);
      if (typeof window !== "undefined") {
        const payload: StoredAuthContext = { email: trimmed, remember };
        window.localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, JSON.stringify(payload));
      }
      setLinkSentTo(trimmed);
    } catch (error) {
      const code = (error as { code?: string })?.code ?? "";
      if (typeof window !== "undefined" && code === "auth/quota-exceeded") {
        try {
          // Set a hold for ~12h to avoid spamming
          const holdUntil = Date.now() + 12 * 60 * 60 * 1000;
          window.localStorage.setItem(QUOTA_HOLD_KEY, String(holdUntil));
        } catch {}
        const ro = "Ai atins limita zilnică pentru linkuri de autentificare. Încearcă mai târziu sau folosește modul oaspete.";
        const en = "Daily quota for sign-in links reached. Please try later or use guest mode.";
        setAuthNotice({ message: navigator.language?.startsWith("ro") ? ro : en });
      } else {
        console.error("sendMagicLink failed", error);
        const ro = "Nu am putut trimite linkul. Încearcă mai târziu.";
        const en = "Could not send the sign-in link. Please try later.";
        setAuthNotice({ message: navigator.language?.startsWith("ro") ? ro : en });
      }
    } finally {
      setSendingLink(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(KEEP_SIGNED_IN_KEY);
    }
    setLinkSentTo(undefined);
  }, []);

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      sendingLink,
      linkSentTo,
      sendMagicLink,
      signOutUser,
      authNotice,
      clearAuthNotice,
    }),
    [authNotice, clearAuthNotice, linkSentTo, loading, sendMagicLink, sendingLink, signOutUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
