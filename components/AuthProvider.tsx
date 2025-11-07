"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  sendingLink: boolean;
  linkSentTo?: string;
  sendMagicLink: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | undefined>(undefined);

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
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem(AUTH_EMAIL_STORAGE_KEY);
      if (!email) {
        const promptValue = window.prompt("Introduce emailul folosit pentru autentificare");
        email = promptValue ? promptValue.trim() : null;
      }
      if (email) {
        void signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((error) => {
            console.error("Email link sign-in failed", error);
          });
      }
    }
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
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
      const actionCodeSettings = {
        url:
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_CONTINUE_URL ??
          (typeof window !== "undefined" ? window.location.origin : undefined) ??
          "http://localhost:3000",
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, trimmed);
      }
      setLinkSentTo(trimmed);
    } finally {
      setSendingLink(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
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
