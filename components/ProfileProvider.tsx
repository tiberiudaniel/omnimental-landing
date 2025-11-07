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

type ProfileRecord = {
  id: string;
  name: string;
  email: string;
  createdAt?: Timestamp;
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
          setProfile({
            id: user.uid,
            name: data.name ?? user.email ?? "Utilizator",
            email: data.email ?? user.email ?? "",
            createdAt: data.createdAt,
          });
        }
      } catch (error) {
        console.error("profile load failed", error);
        if (active) {
          setProfile({
            id: user.uid,
            name: user.email ?? "Utilizator",
            email: user.email ?? "",
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
