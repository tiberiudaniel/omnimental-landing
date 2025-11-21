"use client";

import { doc, runTransaction, serverTimestamp, setDoc, increment, arrayUnion } from "firebase/firestore";
import { ensureAuth, getDb, areWritesDisabled } from "../firebase";
import type { OmniKnowledgeScores } from "../omniKnowledge";
import type { QuestSuggestion } from "../quests";
import type { SessionType } from "../recommendation";
import type { DimensionScores } from "../scoring";
import type { OmniBlock } from "../omniIntel";
import {
  type DeepPartial,
  type ProgressIntentCategories,
  type ProgressMotivationPayload,
  type EvaluationScoreTotals,
  type RecentEntry,
  type FireTs,
} from "./types";

// Basic write throttling to avoid rapid-fire writes that can trigger Firestore backoff
let writeQueue: Promise<unknown> = Promise.resolve();
let lastWriteTs = 0;
let lastSignature: string | null = null;
let lastSigTs = 0;
const MIN_WRITE_INTERVAL_MS = 800; // cooldown between merged writes
const DEDUPE_WINDOW_MS = 1500; // skip identical merges within this window
let suppressUntilTs = 0; // when set due to quota, skip writes until this time

async function mergeProgressFact(data: Record<string, unknown>, ownerId?: string | null) {
  if (areWritesDisabled()) {
    return null;
  }
  const now0 = Date.now();
  if (now0 < suppressUntilTs) {
    return null;
  }
  // Allow explicit owner override (e.g., when wizard has a known profileId).
  // Falls back to the currently authenticated user.
  const user = ownerId ? { uid: ownerId } : await ensureAuth();
  if (!user) return null;
  const updatedAt = serverTimestamp();
  const payload = {
    ...data,
    updatedAt,
  };
  const profilePayload: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    profilePayload[`progressFacts.${key}`] = value;
  });
  const factsRef = doc(getDb(), "userProgressFacts", user.uid);
  const profileRef = doc(getDb(), "userProfiles", user.uid);

  // Enqueue the write and enforce a minimal interval to reduce retry/backoff scenarios
  writeQueue = writeQueue.then(async () => {
    const now = Date.now();
    const since = now - lastWriteTs;
    // Try to dedupe identical merges for a short window
    let signature: string | null = null;
    try {
      signature = JSON.stringify(data);
    } catch {
      signature = null;
    }
    if (signature && lastSignature === signature && now - lastSigTs < DEDUPE_WINDOW_MS) {
      // Skip redundant write
      lastWriteTs = now; // still advance to avoid backlog
      return;
    }
    if (since < MIN_WRITE_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, MIN_WRITE_INTERVAL_MS - since));
    }
    try {
      await Promise.all([
        setDoc(factsRef, payload, { merge: true }).catch((error) => {
          const code = (error && (error.code || error.name)) || "unknown";
          console.warn("progress fact primary write failed", code, error);
          if (String(code).includes("resource-exhausted")) {
            suppressUntilTs = Date.now() + 5 * 60 * 1000; // back off 5 minutes
          }
        }),
        setDoc(profileRef, profilePayload, { merge: true }).catch((error) => {
          const code = (error && (error.code || error.name)) || "unknown";
          console.warn("profile progress mirror write failed", code, error);
          if (String(code).includes("resource-exhausted")) {
            suppressUntilTs = Date.now() + 5 * 60 * 1000;
          }
        }),
      ]);
    } finally {
      lastWriteTs = Date.now();
      if (signature) {
        lastSignature = signature;
        lastSigTs = lastWriteTs;
      }
    }
  });
  await writeQueue;
  return user.uid;
}

// Lightweight tracking helpers for UI analytics
export async function recordEvaluationTabChange(tabKey: string) {
  try {
    await mergeProgressFact({ evaluationTab: { key: tabKey, updatedAt: serverTimestamp() } });
  } catch (e) {
    console.warn("recordEvaluationTabChange failed", e);
  }
}

export async function recordKnowledgeViewSummary() {
  try {
    await mergeProgressFact({ knowledgeSummaryViewed: { at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordKnowledgeViewSummary failed", e);
  }
}

// Lightweight analytics for gating/flows
export async function recordExitModalShown(source: string) {
  try {
    await mergeProgressFact({ analytics: { exit_modal_shown: { source, at: serverTimestamp() } } });
  } catch (e) {
    console.warn("recordExitModalShown failed", e);
  }
}

export async function recordCtaClicked(variant: string) {
  try {
    await mergeProgressFact({ analytics: { cta_clicked: { variant, at: serverTimestamp() } } });
  } catch (e) {
    console.warn("recordCtaClicked failed", e);
  }
}

// Practice counters (reflection / breathing / drill)
// Practice counters (reflection / breathing / drill)
// Optional count allows batching multiple events atomically via increment(count).
export async function recordPracticeEvent(
  type: "reflection" | "breathing" | "drill",
  ownerId?: string | null,
  count = 1,
) {
  try {
    const update: Record<string, unknown> = {};
    const inc = Math.max(1, Math.floor(Number(count) || 1));
    if (type === "reflection") update.reflectionsCount = increment(inc) as unknown as number;
    if (type === "breathing") update.breathingCount = increment(inc) as unknown as number;
    if (type === "drill") update.drillsCount = increment(inc) as unknown as number;
    await mergeProgressFact(update, ownerId);
  } catch (e) {
    console.warn("recordPracticeEvent failed", e);
  }
}

// Record a practice session with duration; complements the simple counters above.
export async function recordPracticeSession(
  type: "reflection" | "breathing" | "drill",
  startedAtMs: number,
  durationSec: number,
  ownerId?: string | null,
) {
  try {
    const entry = {
      type,
      startedAt: new Date(Number.isFinite(startedAtMs) ? startedAtMs : Date.now()),
      // Firestore does not allow serverTimestamp() inside arrayUnion objects; use client time
      endedAt: new Date(),
      durationSec: Math.max(0, Math.floor(durationSec)),
    };
    await mergeProgressFact({ practiceSessions: arrayUnion(entry) }, ownerId);
  } catch (e) {
    console.warn("recordPracticeSession failed", e);
  }
}

export async function recordWizardReset() {
  try {
    await mergeProgressFact({ wizardReset: { at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordWizardReset failed", e);
  }
}

export async function recordWizardResetCanceled() {
  try {
    await mergeProgressFact({ wizardResetCanceled: { at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordWizardResetCanceled failed", e);
  }
}

export async function recordWizardResetNoticeDismissed() {
  try {
    await mergeProgressFact({ wizardResetNoticeDismissed: { at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordWizardResetNoticeDismissed failed", e);
  }
}

export async function recordEvaluationSubmitStarted(stage: string, lang: string) {
  try {
    await mergeProgressFact({ evaluationSubmit: { stage, lang, status: "started", at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordEvaluationSubmitStarted failed", e);
  }
}

export async function recordEvaluationSubmitFinished(stage: string, lang: string, ok: boolean) {
  try {
    await mergeProgressFact({ evaluationSubmit: { stage, lang, status: ok ? "ok" : "failed", at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordEvaluationSubmitFinished failed", e);
  }
}

export async function recordIntentProgressFact(
  payload: {
  tags: string[];
  categories: ProgressIntentCategories;
  urgency: number;
  lang: string;
  firstExpression?: string | null;
  firstCategory?: string | null;
  selectionTotal?: number;
  topCategory?: string | null;
  topShare?: number | null;
  },
  profileId?: string | null,
) {
  return mergeProgressFact(
    {
      intent: {
        ...payload,
        updatedAt: serverTimestamp(),
      },
    },
    profileId,
  );
}

export async function recordMotivationProgressFact(
  payload: ProgressMotivationPayload,
  profileId?: string | null,
) {
  return mergeProgressFact(
    {
      motivation: {
        ...payload,
        updatedAt: serverTimestamp(),
      },
    },
    profileId,
  );
}

export async function recordEvaluationProgressFact(payload: {
  scores: EvaluationScoreTotals;
  knowledge?: OmniKnowledgeScores;
  stageValue: string;
  lang: "ro" | "en";
}) {
  return mergeProgressFact({
    evaluation: {
      ...payload,
      knowledge: payload.knowledge ?? null,
      updatedAt: serverTimestamp(),
    },
  });
}

export async function recordQuestProgressFact(payload: {
  quests: QuestSuggestion[];
}) {
  return mergeProgressFact({
    quests: {
      generatedAt: serverTimestamp(),
      items: payload.quests.map((quest) => ({
        ...quest,
        completed: false,
      })),
    },
    omni: {
      sensei: {
        unlocked: true,
      },
    },
  });
}

export async function recordRecommendationProgressFact(payload: {
  suggestedPath?: SessionType | null;
  reasonKey?: string | null;
  selectedPath?: SessionType | null;
  // allow 'path' for convenience
  path?: SessionType | null;
  acceptedRecommendation?: boolean | null;
  dimensionScores?: DimensionScores | null;
  // extended metadata
  algoVersion?: string | number | null;
  formatPreference?: string | null;
  badgeLabel?: string | null;
  selectedAt?: unknown;
}) {
  return mergeProgressFact({
    recommendation: {
      suggestedPath: (payload.suggestedPath as SessionType | null) ?? null,
      reasonKey: payload.reasonKey ?? null,
      selectedPath: (payload.selectedPath as SessionType | null) ?? (payload.path as SessionType | null) ?? null,
      acceptedRecommendation:
        typeof payload.acceptedRecommendation === "boolean"
          ? payload.acceptedRecommendation
          : payload.selectedPath && payload.suggestedPath
          ? payload.selectedPath === payload.suggestedPath
          : null,
      dimensionScores: payload.dimensionScores ?? null,
      // extended metadata passthrough
      ...(typeof payload.algoVersion !== "undefined" ? { algoVersion: payload.algoVersion } : {}),
      ...(typeof payload.formatPreference !== "undefined" ? { formatPreference: payload.formatPreference } : {}),
      ...(typeof payload.badgeLabel !== "undefined" ? { badgeLabel: payload.badgeLabel } : {}),
      // stamp when a selection is made
      ...((payload.selectedPath || payload.path) ? { selectedAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    },
  });
}

// Text signals aggregation: bump indicator counters, store last tokens sample
export async function recordTextSignalFact(payload: {
  indicators: { calm?: number; focus?: number; energy?: number; relationships?: number; performance?: number };
  tokens?: string[];
  textIndicators?: Record<string, { count: number; hits: string[] }>;
}) {
  const inc = (v?: number) => (typeof v === "number" && Number.isFinite(v) ? (increment(v) as unknown as number) : undefined);
  const update: Record<string, unknown> = {
    analytics: {
      indicators: {
        calm: inc(payload.indicators.calm) ?? undefined,
        focus: inc(payload.indicators.focus) ?? undefined,
        energy: inc(payload.indicators.energy) ?? undefined,
        relationships: inc(payload.indicators.relationships) ?? undefined,
        performance: inc(payload.indicators.performance) ?? undefined,
      },
      lastTokens: Array.isArray(payload.tokens) ? payload.tokens.slice(0, 12) : undefined,
      textIndicators: payload.textIndicators ?? undefined,
      updatedAt: serverTimestamp(),
    },
  };
  return mergeProgressFact(update);
}

// Record a recent entry (e.g., from Journal). Keeps a short rolling list client-side; server can prune if needed.
export async function recordRecentEntry(
  entryIn:
    | string
    | {
        text: string;
        timestamp?: unknown;
        tabId?: string;
        theme?: string | null;
        sourceBlock?: string | null;
      },
  at?: unknown,
  ownerId?: string | null,
) {
  try {
    const isObj = typeof entryIn === 'object' && entryIn !== null;
    const src = isObj ? (entryIn as { text?: unknown; timestamp?: unknown; tabId?: unknown; theme?: unknown; sourceBlock?: unknown }) : null;
    const normalizeTimestamp = (v: unknown): Date | number | FireTs => {
      if (!v) return new Date();
      if (v instanceof Date) return v;
      if (typeof v === 'number') return v;
      const maybe = v as FireTs | { toDate?: () => Date };
      if (maybe && typeof (maybe as { toDate?: () => Date }).toDate === 'function') return maybe as FireTs;
      return new Date();
    };
    const text = String((isObj ? src?.text : entryIn) || '').slice(0, 2000);
    const normalizeForDedupe = (s: string): string => {
      try {
        const base = s
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}+/gu, '')
          .replace(/\s+/g, ' ')
          .trim();
        // collapse runs of the same char longer than 2 to 2 (e.g., "momomoooo" -> "momoo")
        return base.replace(/(.)\1{2,}/g, '$1$1');
      } catch {
        return s.trim();
      }
    };
    const entry: RecentEntry = {
      text,
      // Avoid serverTimestamp() within arrayUnion; use client timestamp
      timestamp: normalizeTimestamp((isObj ? src?.timestamp : undefined) ?? at),
      // Optional metadata to help deep-link back to the right tab
      ...(isObj && src?.tabId ? { tabId: String(src.tabId) } : {}),
      ...(isObj && typeof src?.theme !== 'undefined' ? { theme: (src?.theme as string | null) ?? null } : {}),
      ...(isObj && typeof src?.sourceBlock !== 'undefined' ? { sourceBlock: (src?.sourceBlock as string | null) ?? null } : {}),
    };

    // Source-level dedupe: skip if there is an entry with the same text within the last ~2 minutes
    const toMs = (v: unknown) => {
      try {
        if (!v) return 0;
        if (typeof v === 'number') return v;
        if (v instanceof Date) return v.getTime();
        const ts = v as { toDate?: () => Date };
        if (typeof ts?.toDate === 'function') return ts.toDate().getTime();
      } catch {}
      return 0;
    };
    const user = ownerId ? { uid: ownerId } : await ensureAuth();
    if (!user?.uid) return;

    // Transactional dedupe: add only if no entry with same signature in last 2 minutes
    const db = getDb();
    const factsRef = doc(db, 'userProgressFacts', user.uid);
    const nowMs = toMs(entry.timestamp) || Date.now();
    const tabId = entry.tabId ? String(entry.tabId) : '';
    const bucket = Math.floor(nowMs / 120000); // 2 min bucket for sig
    const sig = `${normalizeForDedupe(text)}|${tabId}|${bucket}`;
    entry.sig = sig;

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(factsRef);
      const data = (snap.exists() ? (snap.data() as { recentEntries?: RecentEntry[] }) : {}) || {};
      const rec: RecentEntry[] = Array.isArray(data.recentEntries) ? data.recentEntries.slice() : [];
      // Stronger dedupe: same normalized text within 12 hours, or same sig (2 min bucket)
      const exists = rec.some((e) => {
        const esig = String(e.sig || '');
        if (esig === sig) return true;
        const etxt = normalizeForDedupe(String(e.text ?? ''));
        const ems = toMs(e.timestamp);
        const dt = Math.abs((nowMs) - (ems || 0));
        return etxt === normalizeForDedupe(text) && dt <= 12 * 60 * 60 * 1000; // 12h window
      });
      if (exists) return;
      // Coalesce rapid incremental drafts: within the same 2‑minute bucket and same tabId/source
      // keep only the latest entry (drop earlier in-bucket variants like "des", "dese", "deseori")
      const recFiltered = rec.filter((e) => {
        const sameTab = (String(e.tabId || '') === tabId);
        const eMs = toMs(e.timestamp);
        const eBucket = eMs ? Math.floor(eMs / 120000) : -1;
        if (sameTab && eBucket === bucket) return false; // drop earlier entries in this window
        return true;
      });
      recFiltered.push(entry);
      // Optional cap to 50 items, newest last for consistency
      const sanitizedAsc = recFiltered
        .map((e) => ({ ...e, _ms: toMs(e.timestamp), _text: normalizeForDedupe(String(e.text ?? '')) }))
        .sort((a, b) => (a._ms ?? 0) - (b._ms ?? 0))
        .slice(-100); // work with up to last 100 before final unique
      // Keep only the latest occurrence per normalized text
      const uniqMap = new Map<string, typeof sanitizedAsc[number]>();
      for (const e of sanitizedAsc) {
        uniqMap.set(e._text, e); // later overwrites earlier (we want latest)
      }
      const uniqueList: RecentEntry[] = Array.from(uniqMap.values())
        .sort((a, b) => (a._ms ?? 0) - (b._ms ?? 0))
        .slice(-50)
        .map((e) => {
          const obj: Record<string, unknown> = {
            text: String(e.text ?? ''),
            timestamp: e.timestamp,
            theme: e.theme ?? null,
            sourceBlock: e.sourceBlock ?? null,
          };
          if (typeof e.tabId === 'string' && e.tabId) obj.tabId = e.tabId;
          if (typeof e.sig === 'string' && e.sig) obj.sig = e.sig;
          return obj as RecentEntry;
        });
      tx.set(factsRef, { recentEntries: uniqueList, updatedAt: serverTimestamp() }, { merge: true });
    });
  } catch (e) {
    console.warn('recordRecentEntry failed', e);
  }
}

// Delete a specific recent entry by matching normalized text and exact timestamp
export async function deleteRecentEntry(
  payload: { text: string; timestamp: unknown },
  ownerId?: string | null,
) {
  try {
    const toMs = (v: unknown) => {
      try {
        if (!v) return 0;
        if (typeof v === 'number') return v;
        if (v instanceof Date) return v.getTime();
        const ts = v as { toDate?: () => Date };
        if (typeof ts?.toDate === 'function') return ts.toDate().getTime();
      } catch {}
      return 0;
    };
    const user = ownerId ? { uid: ownerId } : await ensureAuth();
    if (!user?.uid) return;
    const db = getDb();
    const factsRef = doc(db, 'userProgressFacts', user.uid);
    const targetText = String(payload.text || '').trim();
    const targetMs = toMs(payload.timestamp);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(factsRef);
      if (!snap.exists()) return;
      const data = (snap.data() as { recentEntries?: RecentEntry[] }) || {};
      const rec: RecentEntry[] = Array.isArray(data.recentEntries) ? data.recentEntries : [];
      const filtered = rec.filter((e) => {
        const etxt = String(e.text ?? '').trim();
        const ems = toMs(e.timestamp);
        return !(etxt === targetText && ems === targetMs);
      });
      if (filtered.length !== rec.length) {
        tx.set(factsRef, { recentEntries: filtered, updatedAt: serverTimestamp() }, { merge: true });
      }
    });
  } catch (e) {
    console.warn('deleteRecentEntry failed', e);
  }
}

// Persist evaluation totals and stage value into progress facts


// Patch partial Omni block (deep merge). Useful to update knowledgeIndex/skills/unlocks.
export async function recordOmniPatch(patch: DeepPartial<OmniBlock>, ownerId?: string | null) {
  return mergeProgressFact({
    omni: patch,
  }, ownerId);
}

export async function recordKunoLessonProgress({
  moduleId,
  completedIds,
  ownerId,
  performance,
}: {
  moduleId: string;
  completedIds: string[];
  ownerId?: string | null;
  performance?: {
    recentScores?: number[];
    recentTimeSpent?: number[];
    difficultyBias?: number;
  };
}) {
  try {
    const modulePayload = {
      completedIds,
      lastUpdated: serverTimestamp() as unknown as Date,
      ...(performance
        ? {
            performance: {
              recentScores: performance.recentScores ?? [],
              recentTimeSpent: performance.recentTimeSpent ?? [],
              difficultyBias: performance.difficultyBias ?? 0,
            },
          }
        : {}),
    };
    await recordOmniPatch(
      {
        kuno: {
          modules: {
            [moduleId]: modulePayload,
          },
          lessons: {
            [moduleId]: modulePayload,
          },
        },
      },
      ownerId,
    );
  } catch (e) {
    console.warn("recordKunoLessonProgress failed", e);
    throw e;
  }
}

// Quick self-assessment (lightweight, onboarding). Stores 1–10 sliders for immediate feedback.
export async function recordQuickAssessment(payload: {
  energy: number;
  stress: number;
  sleep: number;
  clarity: number;
  confidence: number;
  focus: number;
}) {
  // Derive internal indices sample (0..100) from sliders
  const asPct = (v: number) => Math.round(Math.max(0, Math.min(100, (Number(v) || 0) * 10)));
  const clarity = asPct(payload.clarity);
  const energy = asPct(payload.energy);
  const calm = (() => {
    const invStress = 10 - (Number(payload.stress) || 0);
    const pieces = [invStress, Number(payload.sleep) || 0].filter((n) => Number.isFinite(n));
    const avg10 = pieces.length ? pieces.reduce((a, b) => a + b, 0) / pieces.length : 0;
    return Math.round(Math.max(0, Math.min(100, avg10 * 10)));
  })();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const key = `d${y}${m}${d}`;
  return mergeProgressFact({
    quickAssessment: {
      energy: payload.energy,
      stress: payload.stress,
      sleep: payload.sleep,
      clarity: payload.clarity,
      confidence: payload.confidence,
      focus: payload.focus,
      updatedAt: serverTimestamp(),
    },
    omni: {
      scope: {
        history: {
          [key]: { clarity, calm, energy, updatedAt: serverTimestamp() },
        },
      },
    },
  });
}

// Record a simple ability practice event and bump skills counters.
export async function recordAbilityPracticeFact(payload: { exercise: string }) {
  // For dev: bump exercisesCompletedCount and skillsIndex heuristically
  return mergeProgressFact({
    abilityLog: {
      lastExercise: payload.exercise,
      updatedAt: serverTimestamp(),
    },
    omni: {
      abil: {
        // increment counters; in dev we also bump skillsIndex by +3 (capped in UI/backfill)
        exercisesCompletedCount: increment(1) as unknown as number,
        skillsIndex: increment(3) as unknown as number,
        unlocked: true,
      },
    },
  });
}

// Mark a quest completion: increments completed count and unlocks Abil.
export async function recordQuestCompletion() {
  return mergeProgressFact({
    omni: {
      sensei: {
        completedQuestsCount: increment(1) as unknown as number,
      },
      abil: {
        unlocked: true,
      },
    },
  });
}

// Ping consistency (active day) and bump consistencyIndex heuristically.
export async function recordConsistencyPing() {
  return mergeProgressFact({
    omni: {
      intel: {
        evaluationsCount: increment(0) as unknown as number,
        consistencyIndex: increment(2) as unknown as number,
      },
    },
  });
}

// Onboarding: store familiarity with Mental Coaching (knew/heard/unknown)
export async function recordFamiliarityMentalCoaching(level: 'knew' | 'heard' | 'unknown', ownerId?: string | null) {
  return mergeProgressFact({
    onboarding: {
      familiarityMentalCoaching: level,
      updatedAt: serverTimestamp(),
    },
  }, ownerId);
}

// Onboarding analytics: generic event logger for wizard steps
export async function recordOnboardingEvent(payload: {
  step: string;
  dwellMs?: number;
  selection?: string;
  skipped?: boolean;
}, ownerId?: string | null) {
  try {
    const entry = {
      step: String(payload.step || 'unknown'),
      dwellMs: typeof payload.dwellMs === 'number' ? Math.max(0, Math.round(payload.dwellMs)) : undefined,
      selection: payload.selection ? String(payload.selection) : undefined,
      skipped: typeof payload.skipped === 'boolean' ? payload.skipped : undefined,
      at: serverTimestamp(),
    } as Record<string, unknown>;
    return mergeProgressFact({ onboarding: { events: arrayUnion(entry) } }, ownerId);
  } catch {
    return null;
  }
}

// CBT survey: store answers under onboarding.cbtSurvey
export async function recordCbtSurvey(payload: {
  emotion?: string;
  distortions?: string[];
  triggers?: string;
  coping?: string[];
  beliefStrength?: number;
  avoidanceLevel?: number;
  readiness?: number;
}, ownerId?: string | null) {
  try {
    return mergeProgressFact({
      onboarding: {
        cbtSurvey: {
          ...payload,
          updatedAt: serverTimestamp(),
        },
      },
    }, ownerId);
  } catch {
    return null;
  }
}

// Store a chosen onboarding lesson hint to guide the next micro‑lesson selection
export async function recordLessonHint(payload: { lessonKey: string; focusTag?: string | null }, ownerId?: string | null) {
  try {
    return mergeProgressFact({
      onboarding: {
        lessonHint: {
          lessonKey: String(payload.lessonKey || ''),
          focusTag: (payload.focusTag ?? null) as string | null,
          updatedAt: serverTimestamp(),
        },
      },
    }, ownerId);
  } catch {
    return null;
  }
}

// Need survey: store computed profile under onboarding.needProfile
export async function recordNeedProfile(payload: {
  primaryOptionId: string | null;
  secondaryOptionId: string | null;
  primaryTag: string | null;
  allTags: string[];
  selfEfficacyScore: number | null;
}, ownerId?: string | null) {
  try {
    return mergeProgressFact({ onboarding: { needProfile: payload, updatedAt: serverTimestamp() } }, ownerId);
  } catch {
    return null;
  }
}

// Activity event log for action trend (knowledge/practice/reflection)
export type ActivityEventLog = {
  startedAt: Date;
  source: 'omnikuno' | 'omniabil' | 'breathing' | 'journal' | 'drill' | 'slider' | 'other';
  category: 'knowledge' | 'practice' | 'reflection';
  units?: number;
  durationMin?: number;
  focusTag?: string | null;
};

export async function recordActivityEvent(payload: {
  startedAtMs?: number;
  source: ActivityEventLog['source'];
  category: ActivityEventLog['category'];
  units?: number;
  durationMin?: number;
  focusTag?: string | null;
}, ownerId?: string | null) {
  try {
    const user = ownerId ? { uid: ownerId } : await ensureAuth();
    if (!user?.uid) return;
    const db = getDb();
    const factsRef = doc(db, 'userProgressFacts', user.uid);
    const ev: ActivityEventLog = {
      startedAt: new Date(Number.isFinite(payload.startedAtMs) ? (payload.startedAtMs as number) : Date.now()),
      source: payload.source,
      category: payload.category,
      units: typeof payload.units === 'number' ? Math.max(1, Math.floor(payload.units)) : 1,
      durationMin: typeof payload.durationMin === 'number' ? Math.max(0, Math.round(payload.durationMin)) : undefined,
      focusTag: (payload.focusTag ?? null) as string | null,
    };
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(factsRef);
      const data = (snap.exists() ? (snap.data() as { activityEvents?: ActivityEventLog[] }) : {}) || {};
      const cur: ActivityEventLog[] = Array.isArray(data.activityEvents) ? data.activityEvents.slice() : [];
      cur.push(ev);
      const pruned = cur.slice(-200); // keep last 200
      tx.set(factsRef, { activityEvents: pruned, updatedAt: serverTimestamp() }, { merge: true });
    });
  } catch (e) {
    console.warn('recordActivityEvent failed', e);
  }
}

// Lightweight habit tick for dashboard guidance card.
// Stores daily ticks under habits.ticks.dYYYYMMDD[habitKey] = N (incremented),
// and updates updatedAt mirror. Caller may also log an ActivityEvent.
export async function recordHabitTick(payload: { habitKey: string }, ownerId?: string | null) {
  try {
    const user = ownerId ? { uid: ownerId } : await ensureAuth();
    if (!user?.uid || areWritesDisabled()) return;
    const db = getDb();
    const factsRef = doc(db, 'userProgressFacts', user.uid);
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const key = `d${y}${m}${d}`;
    await runTransaction(db, async (tx) => {
      tx.set(
        factsRef,
        {
          habits: {
            ticks: {
              [key]: { [payload.habitKey]: increment(1) as unknown as number },
            },
            updatedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });
  } catch (e) {
    console.warn('recordHabitTick failed', e);
  }
}
