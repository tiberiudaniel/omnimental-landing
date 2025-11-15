"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { getDb } from "../lib/firebase";
import { useAuth } from "./AuthProvider";

export type AccessTier = "public" | "member" | "persona";

type ProfileRecord = {
  id: string;
  name: string;
  email: string;
  createdAt?: Timestamp;
  accessTier: AccessTier;
  selection?: "none" | "individual" | "group";
  simulatedInsights?: string[];
  experienceOnboardingCompleted?: boolean;
};

type ProfileContextValue = {
  profile: ProfileRecord | null;
  loading: boolean;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);
const db = getDb();

async function ensureProfileDocument(uid: string, email: string | null | undefined, name?: string | null) {
  const profileRef = doc(db, "userProfiles", uid);
  const snapshot = await getDoc(profileRef);
  if (snapshot.exists()) {
    return snapshot.data() as Omit<ProfileRecord, "id">;
  }
  const payload = {
    name: name?.trim()?.length ? name : email ?? "Utilizator OmniMental",
    email: email ?? "",
    createdAt: Timestamp.now(),
    accessTier: "public" as const,
    selection: "none" as const,
    experienceOnboardingCompleted: false as const,
  };
  await setDoc(profileRef, payload);
  return payload;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let active = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await ensureProfileDocument(user.uid, user.email, user.displayName);
        if (active) {
          const selectionValue = ((data as { selection?: "none" | "individual" | "group" }).selection ?? "none") as
            | "none"
            | "individual"
            | "group";
          const simulatedInsights = Array.isArray((data as { simulatedInsights?: unknown }).simulatedInsights)
            ? ((data as { simulatedInsights?: string[] }).simulatedInsights)
            : undefined;
          setProfile({
            id: user.uid,
            name: data.name ?? user.email ?? "Utilizator",
            email: data.email ?? user.email ?? "",
            createdAt: data.createdAt,
            accessTier: data.accessTier ?? "public",
            selection: selectionValue,
            simulatedInsights,
            experienceOnboardingCompleted: (data as { experienceOnboardingCompleted?: boolean }).experienceOnboardingCompleted ?? false,
          });
        }
      } catch (error) {
        try {
          const search = typeof window !== 'undefined' ? window.location.search : '';
          if (search.includes('e2e=1') || search.includes('demo=1')) {
            console.warn("profile load failed", error);
          } else {
            // Keep default severity outside test/demo
            console.error("profile load failed", error);
          }
        } catch {
          console.error("profile load failed", error);
        }
        if (active) {
          setProfile({
            id: user.uid,
            name: user.email ?? "Utilizator",
            email: user.email ?? "",
            accessTier: "public",
            selection: "none",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProfile().catch(() => setLoading(false));

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const value = useMemo(
    () => ({
      profile,
      loading: authLoading || loading,
    }),
    [authLoading, loading, profile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
