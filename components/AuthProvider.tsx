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

const AUTH_EMAIL_STORAGE_KEY = "omnimental_auth_email";
const KEEP_SIGNED_IN_KEY = "omnimental_keep_signed_in_until";
const KEEP_SIGNED_IN_DURATION_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | undefined>(undefined);
  const pendingRememberRef = useRef<boolean>(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const auth = getFirebaseAuth();
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
        .catch((error) => {
          console.error("Email link sign-in failed", error);
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
    setSendingLink(true);
    try {
      const auth = getFirebaseAuth();
      const base =
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_CONTINUE_URL ??
        (typeof window !== "undefined" ? window.location.origin : undefined) ??
        "http://localhost:3000";
      // Append email to the continue URL so cross-device flows don't rely on prompt
      let continueUrl = base;
      try {
        const u = new URL(base);
        u.searchParams.set("auth_email", trimmed);
        continueUrl = u.toString();
      } catch {
        // fall back to base if URL parsing fails
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

  const value = useMemo(
    () => ({
      user,
      loading,
      sendingLink,
      linkSentTo,
      sendMagicLink,
      signOutUser,
    }),
    [linkSentTo, loading, sendMagicLink, sendingLink, signOutUser, user],
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
