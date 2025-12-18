"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { areWritesDisabled, getDb } from "./firebase";
import { getCatProfile } from "./firebase/cat";
import type { CatProfileDoc } from "@/types/cat";
import type { ProgressFact } from "./progressFacts";
import { getArcById } from "@/config/arcs";
import { isE2EMode, getE2EProfileSnapshot, setE2EProfileSnapshot } from "@/lib/e2eMode";

export type CanonDomainId = "executiveControl" | "decisionalClarity" | "emotionalRegulation" | "functionalEnergy";
export type DomainId = "work" | "personal" | "relationships" | "growth";

export type CatAxisId =
  | "clarity"
  | "focus"
  | "recalibration"
  | "energy"
  | "flexibility"
  | "adaptiveConfidence"
  | "emotionalStability";

export type TraitXp = Partial<Record<CatAxisId, number>>;

export type ConfidenceLevel = "unknown" | "low" | "medium" | "high";

export type CatAxisState = {
  score: number | null; // 0–10
  confidence: ConfidenceLevel;
  lastUpdated: string | null;
  canonDomain: CanonDomainId;
};

export type CatProfile = {
  version: "v2";
  axes: Record<CatAxisId, CatAxisState>;
  updatedAt: string | null;
};

export type CatProfilePatch = Partial<Record<CatAxisId, Partial<CatAxisState>>>;

export type DomainPreference = {
  domainId: DomainId;
  weight: number;
  lastMentioned: string | null;
};

export type IntentSnapshot = {
  textSummary: string | null;
  tags: string[];
  urgency: number | null;
  confidence: number | null;
  createdAt: string | null;
};

export type SubscriptionStatus = "free" | "trial" | "premium";

export type UserSubscription = {
  status: SubscriptionStatus;
  provider?: "stripe" | "manual";
  currentPeriodEnd?: string | null;
};

export type UserProfileSnapshot = {
  userId: string;
  catProfile: CatProfile | null;
  domains: DomainPreference[];
  intentSnapshot: IntentSnapshot | null;
  xpByTrait: TraitXp;
  subscription: UserSubscription;
  sessionsCompleted: number;
  daysActive: number;
  preferredSessionLength: "short" | "medium" | "long";
  activeArcId: string | null;
  activeArcDayIndex: number;
  activeArcCompleted: boolean;
  updatedAt?: string | null;
};

type ProfileDoc = {
  isPremium?: boolean;
  stripeSubscriptionStatus?: SubscriptionStatus;
  preferredSessionLength?: "short" | "medium" | "long";
  sessionsCompleted?: number;
  daysActive?: number;
  catProfileV4?: CatProfile;
  progressFacts?: ProgressFact;
  userDomains?: DomainPreference[];
  activeArcId?: string | null;
  activeArcDayIndex?: number;
  activeArcCompleted?: boolean;
  subscription?: UserSubscription;
  subscriptionProvider?: "stripe" | "manual";
  subscriptionCurrentPeriodEnd?: string | null;
  xpByTrait?: TraitXp;
  updatedAt?: string | Date | { toDate?: () => Date };
};

const AXIS_DOMAIN_MAP: Record<CatAxisId, CanonDomainId> = {
  clarity: "decisionalClarity",
  focus: "executiveControl",
  recalibration: "executiveControl",
  energy: "functionalEnergy",
  flexibility: "executiveControl",
  adaptiveConfidence: "decisionalClarity",
  emotionalStability: "emotionalRegulation",
};

const AXIS_IDS: CatAxisId[] = [
  "clarity",
  "focus",
  "recalibration",
  "energy",
  "flexibility",
  "adaptiveConfidence",
  "emotionalStability",
];

export function getCanonDomainForAxis(axis: CatAxisId): CanonDomainId {
  return AXIS_DOMAIN_MAP[axis];
}

const DOMAIN_KEYWORDS: Record<DomainId, RegExp[]> = {
  work: [/work/i, /job/i, /career/i, /focus/i, /performance/i, /decis/i],
  personal: [/energy/i, /health/i, /body/i, /sleep/i, /personal/i, /calm/i],
  relationships: [/relationship/i, /relatii/i, /family/i, /partner/i, /communication/i],
  growth: [/growth/i, /identity/i, /purpose/i, /self/i, /meaning/i, /belief/i],
};

const DOMAIN_IDS: DomainId[] = ["work", "personal", "relationships", "growth"];

function isDomainId(value: string): value is DomainId {
  return DOMAIN_IDS.includes(value as DomainId);
}

type DomainMeta = { weight: number; lastMentioned: string | null };

function hasDomainMeta(value: unknown): value is DomainMeta {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { weight?: unknown; lastMentioned?: unknown };
  return typeof candidate.weight === "number";
}

function createEmptyCatProfile(): CatProfile {
  const axes = AXIS_IDS.reduce<Record<CatAxisId, CatAxisState>>((acc, axis) => {
    acc[axis] = {
      score: null,
      confidence: "unknown",
      lastUpdated: null,
      canonDomain: AXIS_DOMAIN_MAP[axis],
    };
    return acc;
  }, {} as Record<CatAxisId, CatAxisState>);
  return { version: "v2", axes, updatedAt: null };
}

function tsToIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object" && value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    try {
      return ((value as { toDate?: () => Date }).toDate?.() ?? null)?.toISOString() ?? null;
    } catch {
      return null;
    }
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}

function mapCatProfileDoc(doc: CatProfileDoc | null): CatProfile | null {
  if (!doc) return null;
  const mapped = createEmptyCatProfile();
  AXIS_IDS.forEach((axis) => {
    const legacyKey = (() => {
      switch (axis) {
        case "clarity":
          return "clarity";
        case "focus":
          return "focus";
        case "recalibration":
          return "recalib";
        case "energy":
          return "energy";
        case "flexibility":
          return "flex";
        case "adaptiveConfidence":
          return "adapt_conf";
        case "emotionalStability":
          return "emo_stab";
        default:
          return axis;
      }
    })();
    const rawScore = doc.axisScores?.[legacyKey as keyof typeof doc.axisScores];
    const normalized = typeof rawScore === "number" ? Math.round(Math.max(0, Math.min(100, rawScore)) / 10) : null;
    mapped.axes[axis] = {
      ...mapped.axes[axis],
      score: normalized,
      confidence: normalized !== null ? "medium" : "unknown",
      lastUpdated: tsToIso(doc.updatedAt) ?? tsToIso(doc.completedAt),
    };
  });
  mapped.updatedAt = tsToIso(doc.updatedAt) ?? tsToIso(doc.completedAt);
  return mapped;
}

function mergeProgressFacts(profileFacts?: ProgressFact | null, factsDoc?: ProgressFact | null): ProgressFact | null {
  if (!profileFacts && !factsDoc) return null;
  return { ...(profileFacts ?? {}), ...(factsDoc ?? {}) } as ProgressFact;
}

function classifyDomainTag(value: string): DomainId | null {
  const normalized = value?.toLowerCase() ?? "";
  for (const [domain, patterns] of Object.entries(DOMAIN_KEYWORDS) as Array<[DomainId, RegExp[]]>) {
    if (patterns.some((regex) => regex.test(normalized))) {
      return domain;
    }
  }
  return null;
}

function deriveIntentSnapshot(progressFacts: ProgressFact | null): IntentSnapshot | null {
  const intent = progressFacts?.intent;
  const tags: string[] = [];
  if (Array.isArray(intent?.tags)) {
    intent.tags.forEach((tag) => {
      if (typeof tag === "string" && tag.trim().length) {
        tags.push(tag.trim());
      }
    });
  }
  if (Array.isArray(intent?.categories)) {
    intent.categories.forEach((entry) => {
      if (entry?.category?.trim()) {
        tags.push(entry.category.trim());
      }
    });
  }
  if (!intent && !tags.length) {
    return null;
  }
  const urgency = typeof intent?.urgency === "number" ? intent.urgency : null;
  const derivedConfidence =
    typeof progressFacts?.quickAssessment?.confidence === "number"
      ? progressFacts.quickAssessment.confidence
      : null;
  return {
    textSummary: intent?.firstExpression ?? null,
    tags,
    urgency,
    confidence: derivedConfidence,
    createdAt: tsToIso(intent?.updatedAt),
  };
}

function deriveDomainPreferences(intentSnapshot: IntentSnapshot | null): DomainPreference[] {
  if (!intentSnapshot) return [];
  const weights: Record<DomainId, number> = {
    work: 0,
    personal: 0,
    relationships: 0,
    growth: 0,
  };
  intentSnapshot.tags.forEach((tag) => {
    const domain = classifyDomainTag(tag);
    if (domain) {
      weights[domain] += 1;
    }
  });
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (!total) {
    return [];
  }
  return (Object.entries(weights) as Array<[DomainId, number]>)
    .filter(([, value]) => value > 0)
    .map(([domainId, weight]) => ({
      domainId,
      weight: weight / total,
      lastMentioned: intentSnapshot.createdAt,
    }))
    .sort((a, b) => b.weight - a.weight);
}

function inferSubscriptionStatus(profileData?: ProfileDoc | null): SubscriptionStatus {
  if (!profileData) return "free";
  if (profileData.isPremium) return "premium";
  if (profileData.stripeSubscriptionStatus) return profileData.stripeSubscriptionStatus;
  return "free";
}

function buildFallbackSnapshot(userId: string): UserProfileSnapshot {
  return {
    userId,
    catProfile: null,
    domains: [],
    intentSnapshot: null,
    xpByTrait: {},
    subscription: { status: "free", provider: "manual", currentPeriodEnd: null },
    sessionsCompleted: 0,
    daysActive: 0,
    preferredSessionLength: "short",
    activeArcId: null,
    activeArcDayIndex: 0,
    activeArcCompleted: false,
  };
}

function getOrCreateE2ESnapshot(userId: string): UserProfileSnapshot {
  const existing = getE2EProfileSnapshot<UserProfileSnapshot>(userId);
  if (existing) {
    existing.catProfile = existing.catProfile ?? createEmptyCatProfile();
    existing.xpByTrait = existing.xpByTrait ?? {};
    return existing;
  }
  const fallback = buildFallbackSnapshot(userId);
  fallback.catProfile = createEmptyCatProfile();
  setE2EProfileSnapshot(userId, fallback);
  return fallback;
}

export async function getUserProfileSnapshot(userId: string): Promise<UserProfileSnapshot | null> {
  if (!userId) return null;
  if (isE2EMode()) {
    const stored = getE2EProfileSnapshot<UserProfileSnapshot>(userId);
    if (stored) return stored;
    const fallback = buildFallbackSnapshot(userId);
    fallback.catProfile = fallback.catProfile ?? createEmptyCatProfile();
    setE2EProfileSnapshot(userId, fallback);
    return fallback;
  }
  const db = getDb();
  const profileRef = doc(db, "userProfiles", userId);
  const factsRef = doc(db, "userProgressFacts", userId);

  const [profileSnapResult, factsSnapResult, legacyCatResult] = await Promise.allSettled([
    getDoc(profileRef),
    getDoc(factsRef),
    getCatProfile(userId),
  ]);

  if (profileSnapResult.status === "rejected") {
    console.warn("getUserProfileSnapshot: profile read failed", profileSnapResult.reason);
    return buildFallbackSnapshot(userId);
  }

  const profileSnap = profileSnapResult.value;
  if (factsSnapResult.status === "rejected") {
    console.warn("getUserProfileSnapshot: progress facts read failed", factsSnapResult.reason);
  }
  if (legacyCatResult.status === "rejected") {
    console.warn("getUserProfileSnapshot: legacy CAT read failed", legacyCatResult.reason);
  }
  const factsSnap = factsSnapResult.status === "fulfilled" ? factsSnapResult.value : null;
  const legacyCat = legacyCatResult.status === "fulfilled" ? legacyCatResult.value : null;
  const profileData = profileSnap.exists() ? (profileSnap.data() as ProfileDoc) : null;
  const profileFacts = profileData?.progressFacts ?? null;
  const factsData =
    factsSnap && factsSnap.exists() ? ((factsSnap.data() as ProgressFact) ?? null) : null;
  const mergedFacts = mergeProgressFacts(profileFacts, factsData);

  const intentSnapshot = deriveIntentSnapshot(mergedFacts);
  const storedDomains =
    Array.isArray(profileData?.userDomains) && profileData.userDomains.length
      ? (profileData.userDomains as DomainPreference[])
      : null;
  let domains: DomainPreference[] = [];
  if (storedDomains) {
    domains = storedDomains;
  } else if (profileData?.catProfileV4?.axes) {
    const grouped: Record<string, { weight: number; lastMentioned: string | null }> = {
      work: { weight: 0, lastMentioned: null },
      personal: { weight: 0, lastMentioned: null },
      relationships: { weight: 0, lastMentioned: null },
      growth: { weight: 0, lastMentioned: null },
    };
    Object.entries(profileData.catProfileV4.axes).forEach(([axisId, axis]) => {
      const domain = AXIS_DOMAIN_MAP[axisId as CatAxisId] ?? "work";
      if (!grouped[domain]) {
        grouped[domain] = { weight: 0, lastMentioned: null };
      }
      const addition = typeof axis.score === "number" ? axis.score / 10 : 0;
      grouped[domain].weight += addition;
      if (axis.lastUpdated) {
        grouped[domain].lastMentioned = axis.lastUpdated;
      }
    });
    const totalDomainWeight = Object.values(grouped).reduce((sum, value) => sum + value.weight, 0);
    const domainEntries = Object.entries(grouped).reduce<Array<[DomainId, DomainMeta]>>((acc, [domainId, meta]) => {
      if (isDomainId(domainId) && hasDomainMeta(meta) && meta.weight > 0) {
        acc.push([domainId, meta]);
      }
      return acc;
    }, []);

    domains = domainEntries
      .map(([domainId, meta]) => ({
        domainId,
        weight: totalDomainWeight > 0 ? meta.weight / totalDomainWeight : 0,
        lastMentioned: meta.lastMentioned,
      }))
      .sort((a, b) => b.weight - a.weight);
  } else {
    domains = deriveDomainPreferences(intentSnapshot);
  }

  const mappedCatProfile = profileData?.catProfileV4 ?? mapCatProfileDoc(legacyCat);
  const subscriptionStatus = profileData?.subscription?.status ?? inferSubscriptionStatus(profileData);
  const subscription: UserSubscription = {
    status: subscriptionStatus,
    provider: profileData?.subscription?.provider ?? profileData?.subscriptionProvider ?? "manual",
    currentPeriodEnd: profileData?.subscription?.currentPeriodEnd ?? profileData?.subscriptionCurrentPeriodEnd ?? null,
  };
  const xpByTrait = profileData?.xpByTrait ?? {};
  const sessionsCompleted = profileData?.sessionsCompleted ?? 0;
  const daysActive = profileData?.daysActive ?? 0;
  const preferredSessionLength = profileData?.preferredSessionLength ?? "short";
  const activeArcId = profileData?.activeArcId ?? null;
  const activeArcDayIndex = profileData?.activeArcDayIndex ?? 0;
  const activeArcCompleted = Boolean(profileData?.activeArcCompleted);

  return {
    userId,
    catProfile: mappedCatProfile ?? null,
    domains,
    intentSnapshot,
    xpByTrait,
    subscription,
    sessionsCompleted,
    daysActive,
    preferredSessionLength,
    activeArcId,
    activeArcDayIndex,
    activeArcCompleted,
    updatedAt: profileData?.updatedAt ? tsToIso(profileData.updatedAt) : null,
  };
}

export async function saveCatLiteSnapshot(
  userId: string,
  values: Partial<Record<CatAxisId, number>>,
): Promise<CatProfile | null> {
  if (!userId) return null;
  if (isE2EMode()) {
    const snapshot = getOrCreateE2ESnapshot(userId);
    const profile = snapshot.catProfile ?? createEmptyCatProfile();
    const nowIso = new Date().toISOString();
    AXIS_IDS.forEach((axis) => {
      if (typeof values[axis] !== "number") return;
      const normalized = Math.max(0, Math.min(10, Number(values[axis])));
      profile.axes[axis] = {
        ...profile.axes[axis],
        score: normalized,
        confidence: normalized > 0 ? "low" : "unknown",
        lastUpdated: nowIso,
        canonDomain: AXIS_DOMAIN_MAP[axis],
      };
    });
    profile.updatedAt = nowIso;
    snapshot.catProfile = profile;
    snapshot.updatedAt = nowIso;
    setE2EProfileSnapshot(userId, snapshot);
    return profile;
  }
  const db = getDb();
  const profileRef = doc(db, "userProfiles", userId);
  const snap = await getDoc(profileRef);
  const existing = snap.exists() ? ((snap.data() as ProfileDoc)?.catProfileV4 ?? null) : null;
  const profile = existing ? { ...existing } : createEmptyCatProfile();
  const nowIso = new Date().toISOString();

  AXIS_IDS.forEach((axis) => {
    if (typeof values[axis] !== "number") {
      return;
    }
    const normalized = Math.max(0, Math.min(10, Number(values[axis])));
    profile.axes[axis] = {
      ...profile.axes[axis],
      score: normalized,
      confidence: normalized > 0 ? "low" : "unknown",
      lastUpdated: nowIso,
      canonDomain: AXIS_DOMAIN_MAP[axis],
    };
  });

  profile.updatedAt = nowIso;

  if (!areWritesDisabled()) {
    await setDoc(
      profileRef,
      {
        catProfileV4: profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return profile;
}

export async function applyProfilePatch(
  userId: string,
  catProfilePatch: CatProfilePatch | null,
  domainWeightsPatch?: DomainPreference[],
): Promise<void> {
  if (!userId) return;
  if (isE2EMode()) {
    const snapshot = getOrCreateE2ESnapshot(userId);
    const baseProfile = snapshot.catProfile ?? createEmptyCatProfile();
    let mutated = false;
    if (catProfilePatch) {
      Object.entries(catProfilePatch).forEach(([axisKey, axisPatch]) => {
        if (!axisPatch) return;
        const axis = axisKey as CatAxisId;
        const previous = baseProfile.axes[axis];
        let nextLastUpdated = axisPatch.lastUpdated ?? previous.lastUpdated;
        if (!axisPatch.lastUpdated && typeof axisPatch.score === "number") {
          nextLastUpdated = new Date().toISOString();
        }
        baseProfile.axes[axis] = {
          ...previous,
          ...axisPatch,
          canonDomain: axisPatch.canonDomain ?? previous.canonDomain ?? AXIS_DOMAIN_MAP[axis],
          lastUpdated: nextLastUpdated,
        };
        mutated = true;
      });
    }
    if (mutated) {
      baseProfile.updatedAt = new Date().toISOString();
      snapshot.catProfile = baseProfile;
    }
    if (domainWeightsPatch && domainWeightsPatch.length) {
      snapshot.domains = domainWeightsPatch;
    }
    setE2EProfileSnapshot(userId, snapshot);
    return;
  }
  const hasCatPatch = Boolean(catProfilePatch && Object.keys(catProfilePatch).length);
  const hasDomainPatch = Boolean(domainWeightsPatch && domainWeightsPatch.length);
  if (!hasCatPatch && !hasDomainPatch) {
    return;
  }
  const db = getDb();
  const profileRef = doc(db, "userProfiles", userId);
  const snap = await getDoc(profileRef);
  const existing = snap.exists() ? (snap.data() as ProfileDoc) : null;
  const baseProfile = existing?.catProfileV4 ?? createEmptyCatProfile();
  let mutated = false;

  if (catProfilePatch) {
    Object.entries(catProfilePatch).forEach(([axisKey, axisPatch]) => {
      if (!axisPatch) return;
      const axis = axisKey as CatAxisId;
      const previous =
        baseProfile.axes[axis] ??
        ({
          score: null,
          confidence: "unknown",
          lastUpdated: null,
          canonDomain: AXIS_DOMAIN_MAP[axis],
        } satisfies CatAxisState);
      let nextLastUpdated = axisPatch.lastUpdated ?? previous.lastUpdated;
      if (!axisPatch.lastUpdated && typeof axisPatch.score === "number") {
        nextLastUpdated = new Date().toISOString();
      }
      baseProfile.axes[axis] = {
        ...previous,
        ...axisPatch,
        canonDomain: axisPatch.canonDomain ?? previous.canonDomain ?? AXIS_DOMAIN_MAP[axis],
        lastUpdated: nextLastUpdated,
      };
      mutated = true;
    });
  }

  if (mutated) {
    baseProfile.updatedAt = new Date().toISOString();
  }

  const payload: Record<string, unknown> = {};
  if (mutated) {
    payload.catProfileV4 = baseProfile;
  }
  if (hasDomainPatch && domainWeightsPatch) {
    payload.userDomains = domainWeightsPatch;
  }

  if (!Object.keys(payload).length || areWritesDisabled()) {
    return;
  }

  await setDoc(profileRef, payload, { merge: true });
}

export async function advanceArcProgress(
  userId: string,
  arcId: string,
  options?: { completedToday?: boolean },
): Promise<void> {
  if (!userId || !arcId || areWritesDisabled()) return;
  if (isE2EMode()) {
    const snapshot = getOrCreateE2ESnapshot(userId);
    if (!snapshot.activeArcId || snapshot.activeArcId !== arcId) {
      snapshot.activeArcId = arcId;
      snapshot.activeArcDayIndex = 0;
      snapshot.activeArcCompleted = false;
    }
    const arcConfig = getArcById(snapshot.activeArcId);
    const arcLength = arcConfig?.lengthDays ?? arcConfig?.moduleIds.length ?? 1;
    const maxIndex = Math.max((arcLength ?? 1) - 1, 0);
    if (options?.completedToday) {
      snapshot.activeArcDayIndex = Math.min((snapshot.activeArcDayIndex ?? 0) + 1, maxIndex);
      if (arcLength > 0 && snapshot.activeArcDayIndex >= maxIndex) {
        snapshot.activeArcCompleted = true;
      }
    }
    setE2EProfileSnapshot(userId, snapshot);
    return;
  }
  const db = getDb();
  const profileRef = doc(db, "userProfiles", userId);
  const snap = await getDoc(profileRef);
  const existing = snap.exists() ? (snap.data() as ProfileDoc) : null;
  let nextArcId = existing?.activeArcId ?? arcId;
  let nextDayIndex = existing?.activeArcDayIndex ?? 0;
  let nextCompleted = existing?.activeArcCompleted ?? false;
  if (!existing?.activeArcId || existing.activeArcId !== arcId) {
    nextArcId = arcId;
    nextDayIndex = 0;
    nextCompleted = false;
  }
  const arcConfig = nextArcId ? getArcById(nextArcId) : null;
  const arcLength = arcConfig ? arcConfig.lengthDays ?? arcConfig.moduleIds.length ?? 1 : null;
  const maxIndex = arcLength !== null ? Math.max(arcLength - 1, 0) : 0;
  if (options?.completedToday && nextArcId === arcId) {
    let updatedIndex = nextDayIndex + 1;
    if (arcLength !== null) {
      updatedIndex = Math.min(updatedIndex, maxIndex);
      if (arcLength > 0 && updatedIndex >= maxIndex) {
        nextCompleted = true;
      }
    }
    nextDayIndex = updatedIndex;
  }
  if (arcLength !== null && nextDayIndex > maxIndex) {
    nextDayIndex = maxIndex;
    if (arcLength > 0) {
      nextCompleted = true;
    }
  }
  if (
    nextArcId === existing?.activeArcId &&
    nextDayIndex === (existing?.activeArcDayIndex ?? 0) &&
    nextCompleted === (existing?.activeArcCompleted ?? false)
  ) {
    return;
  }
  await setDoc(
    profileRef,
    {
      activeArcId: nextArcId,
      activeArcDayIndex: nextDayIndex,
      activeArcCompleted: nextCompleted,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function addTraitXp(userId: string, trait: CatAxisId, amount: number): Promise<void> {
  if (!userId || !trait || !amount || areWritesDisabled()) return;
  if (isE2EMode()) {
    const snapshot = getOrCreateE2ESnapshot(userId);
    const current = snapshot.xpByTrait?.[trait] ?? 0;
    snapshot.xpByTrait = {
      ...(snapshot.xpByTrait ?? {}),
      [trait]: Math.max(0, current + amount),
    };
    setE2EProfileSnapshot(userId, snapshot);
    return;
  }
  const db = getDb();
  const profileRef = doc(db, "userProfiles", userId);
  const snap = await getDoc(profileRef);
  const existing = snap.exists() ? (snap.data() as ProfileDoc) : null;
  const currentXp = existing?.xpByTrait?.[trait] ?? 0;
  const nextXp = Math.max(0, currentXp + amount);
  const nextPayload: TraitXp = {
    ...(existing?.xpByTrait ?? {}),
    [trait]: nextXp,
  };
  await setDoc(
    profileRef,
    {
      xpByTrait: nextPayload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
const TRAIT_LABELS: Record<CatAxisId, string> = {
  clarity: "Claritate",
  focus: "Focus și continuitate",
  recalibration: "Recalibrare",
  energy: "Energie",
  flexibility: "Flexibilitate",
  adaptiveConfidence: "Încredere adaptativă",
  emotionalStability: "Stabilitate emoțională",
};

export function getTraitLabel(axis: CatAxisId): string {
  return TRAIT_LABELS[axis] ?? axis;
}
