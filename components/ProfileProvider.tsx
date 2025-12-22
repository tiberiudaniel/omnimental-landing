"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { doc, getDoc, onSnapshot, setDoc, Timestamp } from "firebase/firestore";
import { getDb } from "../lib/firebase";
import { useAuth } from "./AuthProvider";
import type { MissionSummary } from "@/lib/hooks/useMissionPerspective";
import { isE2EMode, E2E_USER_ID } from "@/lib/e2eMode";
import { setTrackingContext } from "@/lib/telemetry/trackContext";

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
  activeMission?: MissionSummary | null;
  isPremium?: boolean;
  plan?: "monthly" | "annual" | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  premiumUpdatedAt?: Timestamp | null;
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
    activeMission: null as MissionSummary | null,
    isPremium: false as const,
    plan: null as "monthly" | "annual" | null,
    stripeCustomerId: null as string | null,
    stripeSubscriptionId: null as string | null,
    premiumUpdatedAt: Timestamp.now(),
  };
  await setDoc(profileRef, payload);
  return payload;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const e2eMode = isE2EMode();
  const e2eProfile = useMemo<ProfileRecord | null>(() => {
    if (!e2eMode) return null;
    return {
      id: user?.uid ?? E2E_USER_ID,
      name: "E2E User",
      email: "e2e@omnimental.dev",
      accessTier: "public",
      selection: "individual",
      createdAt: Timestamp.now(),
      simulatedInsights: [],
      experienceOnboardingCompleted: true,
      activeMission: null,
      isPremium: true,
      plan: "monthly",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      premiumUpdatedAt: Timestamp.now(),
    };
  }, [e2eMode, user?.uid]);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (e2eMode) {
      return;
    }

    if (authLoading) {
      return;
    }
    let cancelled = false;
    if (!user) {
      queueMicrotask(() => {
        if (cancelled) return;
        setProfile(null);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    let active = true;
    let unsubscribe: (() => void) | null = null;
    const listen = async () => {
      setLoading(true);
      try {
        await ensureProfileDocument(user.uid, user.email, user.displayName);
        if (!active) return;
        const profileRef = doc(db, "userProfiles", user.uid);
        unsubscribe = onSnapshot(
          profileRef,
          (snapshot) => {
            if (!snapshot.exists()) {
              if (!active) return;
              setProfile({
                id: user.uid,
                name: user.email ?? "Utilizator",
                email: user.email ?? "",
                accessTier: "public",
                selection: "none",
                activeMission: null,
                isPremium: false,
                plan: null,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                premiumUpdatedAt: undefined,
              });
              setLoading(false);
              return;
            }
            if (!active) return;
            const data = snapshot.data() as Omit<ProfileRecord, "id"> | undefined;
            setProfile(mapProfilePayload(user.uid, user, data));
            setLoading(false);
          },
          (error) => {
            console.error("profile snapshot failed", error);
            if (!active) return;
            setLoading(false);
          },
        );
      } catch (error) {
        console.error("profile load failed", error);
        if (active) {
          setProfile({
            id: user.uid,
            name: user.email ?? "Utilizator",
            email: user.email ?? "",
            accessTier: "public",
            selection: "none",
            activeMission: null,
            isPremium: false,
            plan: null,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            premiumUpdatedAt: undefined,
          });
          setLoading(false);
        }
      }
    };

    listen().catch(() => setLoading(false));

    return () => {
      cancelled = true;
      active = false;
      unsubscribe?.();
    };
  }, [authLoading, user, e2eMode]);

  const value = useMemo(
    () => ({
      profile: e2eProfile ?? profile,
      loading: e2eProfile ? false : authLoading || loading,
    }),
    [authLoading, e2eProfile, loading, profile],
  );

  useEffect(() => {
    if (e2eProfile) {
      setTrackingContext({
        userId: e2eProfile.id,
        isPremium: e2eProfile.isPremium,
        accessTier: e2eProfile.accessTier,
      });
      return;
    }
    if (authLoading) return;
    if (!user) {
      setTrackingContext({
        userId: null,
        isPremium: null,
        accessTier: null,
      });
      return;
    }
    if (!profile) return;
    setTrackingContext({
      userId: profile.id,
      isPremium: profile.isPremium ?? null,
      accessTier: profile.accessTier ?? null,
    });
  }, [authLoading, e2eProfile, profile, user]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

function mapProfilePayload(
  uid: string,
  user: { email: string | null; displayName?: string | null },
  data: Omit<ProfileRecord, "id"> | undefined,
): ProfileRecord {
  const selectionValue = ((data as { selection?: "none" | "individual" | "group" } | undefined)?.selection ?? "none") as
    | "none"
    | "individual"
    | "group";
  const simulatedInsights = Array.isArray((data as { simulatedInsights?: unknown } | undefined)?.simulatedInsights)
    ? ((data as { simulatedInsights?: string[] }).simulatedInsights)
    : undefined;
  const mission =
    ((data as { activeMission?: MissionSummary | null } | undefined)?.activeMission as MissionSummary | null | undefined) ??
    null;
  const isPremium = Boolean((data as { isPremium?: boolean } | undefined)?.isPremium);
  const planValue = (data as { plan?: "monthly" | "annual" | null } | undefined)?.plan ?? null;
  const stripeCustomerId = (data as { stripeCustomerId?: string | null } | undefined)?.stripeCustomerId ?? null;
  const stripeSubscriptionId = (data as { stripeSubscriptionId?: string | null } | undefined)?.stripeSubscriptionId ?? null;
  const premiumUpdatedAt = (data as { premiumUpdatedAt?: Timestamp | null } | undefined)?.premiumUpdatedAt ?? null;
  return {
    id: uid,
    name: data?.name ?? user.displayName ?? user.email ?? "Utilizator OmniMental",
    email: data?.email ?? user.email ?? "",
    createdAt: data?.createdAt,
    accessTier: data?.accessTier ?? "public",
    selection: selectionValue,
    simulatedInsights,
    experienceOnboardingCompleted: (data as { experienceOnboardingCompleted?: boolean } | undefined)
      ?.experienceOnboardingCompleted ?? false,
    activeMission: mission,
    isPremium,
    plan: planValue,
    stripeCustomerId,
    stripeSubscriptionId,
    premiumUpdatedAt,
  };
}
