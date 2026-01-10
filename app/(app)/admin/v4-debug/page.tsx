"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { getSensAiTodayPlan } from "@/lib/omniSensAI";
import type { SessionPlan } from "@/lib/sessionRecommenderEngine";
import { getTraitLabel, type UserProfileSnapshot, type CatAxisId } from "@/lib/profileEngine";
import type { SessionTelemetry, TelemetryOrigin, TelemetrySessionType } from "@/lib/telemetry";
import { fetchRecentSessions } from "@/lib/telemetryStore";
import { ARC_CONFIGS, getArcById } from "@/config/arcs";
import { simulateV4Progress } from "@/lib/simulation/v4Simulator";
import { fetchRecentTelemetryUsers } from "@/lib/adminTelemetry";
import { getWowLessonDefinition } from "@/config/wowLessonsV2";
import {
  ProfileCard,
  TraitTable,
  DomainList,
  XpList,
  ArcSubscription,
  RawJsonViewer,
  ArcCoverageCard,
  TraitCoverageCard,
  ActiveArcProgressCard,
  TRAIT_LABELS,
} from "./ProfileSnapshotComponents";
import { getTodayKey } from "@/lib/time/todayKey";
import type { ArcCoverageRow, TraitCoverageRow, ActiveArcProgressData } from "./ProfileSnapshotComponents";

const SESSION_FILTERS: Array<{ id: TelemetrySessionType; label: string }> = [
  { id: "daily", label: "Daily" },
  { id: "arena", label: "Arena" },
  { id: "wizard", label: "Onboarding" },
];

const ORIGIN_FILTERS: Array<{ id: "all" | TelemetryOrigin; label: string }> = [
  { id: "all", label: "Toate" },
  { id: "real", label: "Doar real" },
  { id: "simulated", label: "Doar simulate" },
];

const KPI_LABEL_MAP: Record<string, string> = {
  exec_control_stroop_v1: "Micro-Stroop",
  mental_clarity: "Claritate mentală",
  emotional_balance: "Echilibru emoțional",
  physical_energy: "Energie fizică",
};

type TimelineEntry = {
  dateKey: string;
  label: string;
  entries: Array<{
    id: string;
    time: string;
    sessionType: TelemetrySessionType | string;
    origin: TelemetryOrigin;
    flowTag?: string | null;
    arcId: string | null;
    moduleId: string | null;
    difficulty: string | null;
    indicators: string[];
    xpGain: number;
    sortKey: number;
    traitPrimaryLabel: string | null;
    traitSecondaryLabel: string | null;
  }>;
};
export default function AdminV4DebugPage() {
  const navLinks = useNavigationLinks();
  const { user, authReady } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userOptions, setUserOptions] = useState<string[]>([]);
  const [manualUserId, setManualUserId] = useState("");
  const [profileSnapshot, setProfileSnapshot] = useState<UserProfileSnapshot | null>(null);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [sessions, setSessions] = useState<SessionTelemetry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simDays, setSimDays] = useState(5);
  const [simulatePending, startSimulate] = useTransition();
  const [sessionTypeFilter, setSessionTypeFilter] = useState<Record<string, boolean>>({
    daily: true,
    arena: true,
    wizard: true,
  });
  const [originFilter, setOriginFilter] = useState<"all" | TelemetryOrigin>("all");

  const handleUserSwitch = useCallback((uid: string) => {
    if (!uid) return;
    setSelectedUserId(uid);
    setUserOptions((prev) => mergeUniqueUsers([uid, ...prev]));
  }, []);

  const availableUserIds = useMemo(
    () => mergeUniqueUsers([...(userOptions ?? []), selectedUserId]),
    [userOptions, selectedUserId],
  );

  const canSimulate = Boolean(selectedUserId && selectedUserId === user?.uid);

  const loadData = useCallback(
    async (uid: string, token?: { cancelled: boolean }) => {
      setLoading(true);
      try {
        const result = await getSensAiTodayPlan(uid);
        if (!token?.cancelled) {
          setProfileSnapshot(result.ctx?.profile ?? null);
          setPlan(result.plan);
        }
        const recent = await fetchRecentSessions(uid, 60);
        if (!token?.cancelled) {
          setSessions(recent);
          setError(null);
        }
      } catch (err) {
        console.warn("admin v4 debug load failed", err);
        if (!token?.cancelled) {
          setError("Nu am putut încărca datele.");
        }
      } finally {
        if (!token?.cancelled) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!authReady || !user || selectedUserId) return;
    setSelectedUserId(user.uid);
  }, [authReady, user, selectedUserId]);

  useEffect(() => {
    if (!authReady || !selectedUserId) return;
    const token = { cancelled: false };
    void loadData(selectedUserId, token);
    return () => {
      token.cancelled = true;
    };
  }, [authReady, selectedUserId, loadData]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    fetchRecentTelemetryUsers(10)
      .then((recent) => {
        if (cancelled) return;
        const seeded = mergeUniqueUsers([user?.uid ?? null, ...(recent ?? [])]);
        setUserOptions(seeded);
      })
      .catch((err) => console.warn("load recent telemetry users failed", err));
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const typeFlag =
        Object.prototype.hasOwnProperty.call(sessionTypeFilter, session.sessionType) ?
          sessionTypeFilter[session.sessionType] :
          true;
      if (!typeFlag) return false;
      const originValue = session.origin ?? "real";
      if (originFilter !== "all" && originValue !== originFilter) return false;
      return true;
    });
  }, [sessions, sessionTypeFilter, originFilter]);

  const timeline = useMemo(() => buildTimeline(filteredSessions), [filteredSessions]);

  const activeArcSummary = useMemo(() => {
    if (!profileSnapshot?.activeArcId) return null;
    const arc = getArcById(profileSnapshot.activeArcId);
    if (!arc) return null;
    return {
      arc,
      dayIndex: profileSnapshot.activeArcDayIndex ?? 0,
      xp: profileSnapshot.xpByTrait?.[arc.traitPrimary] ?? 0,
    };
  }, [profileSnapshot]);

  const planArcDayNumber = activeArcSummary
    ? activeArcSummary.dayIndex + 1
    : plan
    ? (plan.arcDayIndex ?? 0) + 1
    : null;
  const displayArcDayNumber = planArcDayNumber;
  const planArcLength = activeArcSummary?.arc.lengthDays ?? plan?.arcLengthDays ?? null;

  const onboardingSummary = useMemo(() => {
    const hasCatProfile = Boolean(profileSnapshot?.catProfile);
    const hasStroopKpi = sessions.some(
      (session) =>
        session.flowTag === "onboarding" &&
        (session.kpiEvents || []).some((event) => event.canonDomain === "executiveControl"),
    );
    const hasFirstSession = sessions.some(
      (session) => session.sessionType === "daily" && session.flowTag === "onboarding",
    );
    const hasFirstTemple = Boolean(profileSnapshot?.activeArcId);
    const missing: string[] = [];
    if (!hasCatProfile) missing.push("CAT lipsă");
    if (!hasStroopKpi) missing.push("Stroop lipsă");
    if (!hasFirstSession) missing.push("Sesiune lipsă");
    if (!hasFirstTemple) missing.push("Arc inactiv");
    return {
      status: missing.length ? "partial" : "complete",
      missing,
    };
  }, [profileSnapshot, sessions]);

  const todaySummary = useMemo(() => {
    const dailySessions = sessions.filter((session) => session.sessionType === "daily");
    const dayKeys = new Set<string>();
    const todayKey = getTodayKey();
    let sessionsToday = 0;
    let realCount = 0;
    dailySessions.forEach((session) => {
      const key = getSessionDateKey(session);
      if (key) {
        dayKeys.add(key);
        if (key === todayKey) {
          sessionsToday += 1;
        }
      }
      if ((session.origin ?? "real") === "real") {
        realCount += 1;
      }
    });
    return {
      daysActive: dayKeys.size,
      total: dailySessions.length,
      realCount,
      simulatedCount: Math.max(0, dailySessions.length - realCount),
      sessionsToday,
    };
  }, [sessions]);

  const arenaSummary = useMemo(() => {
    const counts = sessions
      .filter((session) => session.sessionType === "arena")
      .reduce<Record<string, number>>((acc, session) => {
        const key = session.arenaId ?? session.moduleId ?? "necunoscut";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
    const entries = Object.entries(counts);
    return { total: entries.reduce((sum, [, value]) => sum + value, 0), entries };
  }, [sessions]);

  const monetizationSummary = useMemo(() => {
    const status = profileSnapshot?.subscription?.status ?? "free";
    const provider = profileSnapshot?.subscription?.provider ?? "manual";
    return {
      status,
      provider,
      upgradeClicks: 0,
      lastAttempt: "—",
    };
  }, [profileSnapshot]);

  const warnings = useMemo(() => {
    const list: string[] = [];
    const hasCat = Boolean(profileSnapshot?.catProfile);
    const hasRealDaily = sessions.some(
      (session) => session.sessionType === "daily" && (session.origin ?? "real") === "real",
    );
    const activeArcId = profileSnapshot?.activeArcId ?? null;
    if (!hasCat && hasRealDaily) {
      list.push("Există sesiuni reale fără CAT inițial.");
    }
    if (activeArcId && !hasCat) {
      list.push("Arc activ fără profil CAT.");
    }
    if (
      profileSnapshot?.activeArcCompleted &&
      activeArcId &&
      sessions.some((session) => session.sessionType === "daily" && session.arcId === activeArcId)
    ) {
      list.push("Arc marcat complet, dar contul încă rulează antrenamente zilnice.");
    }
    if (sessions.some((session) => session.sessionType === "daily" && !session.arcId)) {
      list.push("Sesiuni zilnice fără arcId asociat.");
    }
    return list;
  }, [profileSnapshot, sessions]);

  const arcCoverageData = useMemo(
    () => buildArcCoverageData(sessions, profileSnapshot),
    [sessions, profileSnapshot],
  );

  const traitCoverageData = useMemo(
    () => buildTraitCoverageData(sessions, profileSnapshot),
    [sessions, profileSnapshot],
  );

  const activeArcProgress = useMemo(
    () => buildActiveArcProgressData(sessions, profileSnapshot),
    [sessions, profileSnapshot],
  );

  const handleSimulate = useCallback(() => {
    if (!selectedUserId) return;
    startSimulate(async () => {
      try {
        await simulateV4Progress(selectedUserId, { days: simDays, pretendDates: true });
        await loadData(selectedUserId);
      } catch (err) {
        console.warn("Simulate progress failed", err);
        setError("Simularea a eșuat. Verifică consola.");
      }
    });
  }, [selectedUserId, simDays, loadData]);

  const header = (
    <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => {}} />
  );

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-center text-[var(--omni-ink)]">
        Se verifică starea utilizatorului…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-center text-[var(--omni-ink)]">
        <p>Autentifică-te pentru a vedea datele v4.</p>
      </div>
    );
  }

  const latestSessions = sessions.slice(0, 6);

  return (
    <>
      <AppShell header={header}>
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
          <section className="space-y-5 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">Overview</p>
              <h1 className="text-3xl font-semibold text-white">V4 Debug View</h1>
              {loading ? <p className="text-sm text-slate-400">Se încarcă datele...</p> : null}
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs font-semibold uppercas
e tracking-wide text-slate-400">Utilizator curent</p>
              <p className="mt-1 text-sm text-slate-200">
                {selectedUserId ? (
                  <span className="font-mono text-base text-white">{selectedUserId}</span>
                ) : (
                  "Selectează un utilizator din listă"
                )}
              </p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end">
                <label className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Utilizatori recenți
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
                    value={selectedUserId ?? ""}
                    onChange={(event) => handleUserSwitch(event.target.value)}
                  >
                    <option value="" disabled>
                      Alege un utilizator
                    </option>
                    {availableUserIds.map((uid) => (
                      <option key={uid} value={uid}>
                        {uid}
                        {uid === user?.uid ? " (eu)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-1 flex-col gap-2 text-sm text-slate-200 md:flex-row md:items-center">
                  <input
                    type="text"
                    value={manualUserId}
                    onChange={(event) => setManualUserId(event.target.value)}
                    placeholder="Introdu userId"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = manualUserId.trim();
                      if (trimmed) {
                        handleUserSwitch(trimmed);
                        setManualUserId("");
                      }
                    }}
                    className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white"
                  >
                    Încarcă
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-4 rounded-lg border border-slate-800 bg-black/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">Profil Snapshot</p>
              <div className="grid gap-3 md:grid-cols-2">
                <ProfileCard title="CAT Profile" accent="text-sky-400">
                  <TraitTable snapshot={profileSnapshot} />
                </ProfileCard>
                <ProfileCard title="Domenii" accent="text-emerald-400">
                  <DomainList snapshot={profileSnapshot} />
                </ProfileCard>
                <ProfileCard title="XP pe trăsături" accent="text-purple-400">
                  <XpList snapshot={profileSnapshot} />
                </ProfileCard>
                <ProfileCard title="Arc & Abonament" accent="text-amber-400">
                  <ArcSubscription snapshot={profileSnapshot} />
                </ProfileCard>
              </div>
              <RawJsonViewer data={profileSnapshot} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ArcCoverageCard data={arcCoverageData} />
              <TraitCoverageCard data={traitCoverageData} />
            </div>
            <ActiveArcProgressCard data={activeArcProgress} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">Rezumat flow-uri</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <FlowSummaryCard
                  title="Onboarding"
                  accentClass="text-sky-400"
                  borderClass="border-sky-500/40"
                  copy={
                    onboardingSummary.status === "complete"
                      ? "Complet — toate reperele bifate."
                      : `Parțial — lipsă: ${onboardingSummary.missing.join(", ") || "—"}`
                  }
                />
                <FlowSummaryCard
                  title="Today"
                  accentClass="text-emerald-400"
                  borderClass="border-emerald-500/40"
                  copy={`Zile active: ${todaySummary.daysActive} · Sesiuni: ${todaySummary.total} (Real ${todaySummary.realCount} / Sim ${todaySummary.simulatedCount}) · Azi: ${todaySummary.sessionsToday}`}
                />
                <FlowSummaryCard
                  title="Arene"
                  accentClass="text-violet-400"
                  borderClass="border-violet-500/40"
                  copy={
                    arenaSummary.entries.length
                      ? `${arenaSummary.total} rulate — ${arenaSummary.entries
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(", ")}`
                      : "Nu există rulări."
                  }
                />
                <FlowSummaryCard
                  title="Monetizare"
                  accentClass="text-amber-400"
                  borderClass="border-amber-500/40"
                  copy={`Abonament: ${monetizationSummary.status.toUpperCase()} · Provider: ${monetizationSummary.provider}`}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Plan curent</p>
                {plan ? (
                  <div className="mt-2 space-y-1 text-sm text-slate-200">
                    <p>
                      <span className="text-slate-400">Arc:</span> {plan.arcId ?? "—"} · Ziua {planArcDayNumber ?? "—"}
                      {planArcLength ? ` / ${planArcLength}` : ""}
                    </p>
                    <p>
                      <span className="text-slate-400">Modul:</span> {plan.moduleId}
                    </p>
                    <p>
                      <span className="text-slate-400">Durată:</span> {plan.expectedDurationMinutes} min
                    </p>
                    <p>
                      <span className="text-slate-400">Trăsături:</span> {plan.traitPrimary}
                      {plan.traitSecondary.length ? ` (+ ${plan.traitSecondary.join(", ")})` : ""}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">Nu există un plan disponibil.</p>
                )}
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Arc activ</p>
                  {profileSnapshot?.activeArcCompleted ? (
                    <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
                      Arc completat
                    </span>
                  ) : null}
                </div>
                {activeArcSummary ? (
                  <div className="mt-2 space-y-1 text-sm text-slate-200">
                    <p>
                      <span className="text-slate-400">Arc:</span> {activeArcSummary.arc.name} ({activeArcSummary.arc.id})
                    </p>
                    <p>
                      <span className="text-slate-400">Ziua curentă:</span> {displayArcDayNumber ?? "—"} / {planArcLength ?? activeArcSummary.arc.lengthDays}
                    </p>
                    <p>
                      <span className="text-slate-400">Trait primar:</span> {getTraitLabel(activeArcSummary.arc.traitPrimary)}
                    </p>
                    <p>
                      <span className="text-slate-400">XP acumulat:</span> {activeArcSummary.xp} XP
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">Nu există un arc activ.</p>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-500/80 bg-rose-950/60 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-300">Avertizări rapide</p>
              {warnings.length === 0 ? (
                <p className="text-xs text-rose-100">Nicio anomalie pentru acest utilizator.</p>
              ) : (
                <ul className="space-y-1">
                  {warnings.map((warning) => (
                    <li key={warning} className="text-xs text-rose-100">
                      <span className="font-semibold">•</span> {warning}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Ultimele sesiuni</p>
              {latestSessions.length === 0 ? (
                <p className="text-sm text-slate-400">Nu există sesiuni înregistrate.</p>
              ) : (
                latestSessions.map((session) => {
                  const indicatorLabels = formatIndicatorLabels(
                    session.kpiEvents?.map((event) => event.indicatorId).filter(Boolean) ?? [],
                    session.moduleId,
                  );
                  const traitInfo = resolveSessionTraitInfo(session);
                  return (
                    <div key={session.sessionId} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm">
                      <SessionBadges flowTag={session.flowTag} origin={session.origin ?? "real"} sessionType={session.sessionType} />
                      <p className="text-slate-100">
                        <span className="text-slate-400">Arc:</span> {session.arcId ?? "—"}
                      </p>
                      <p className="text-slate-100">
                        <span className="text-slate-400">Modul:</span> {session.moduleId ?? "—"}
                      </p>
                      {traitInfo.traitPrimaryLabel ? (
                        <p className="text-slate-100">
                          <span className="text-slate-400">Trait:</span> {traitInfo.traitPrimaryLabel}
                          {traitInfo.traitSecondaryLabel ? ` (secundar: ${traitInfo.traitSecondaryLabel})` : ""}
                        </p>
                      ) : null}
                      <p className="text-slate-100">
                        <span className="text-slate-400">Feedback:</span> {session.difficultyFeedback ?? "—"}
                      </p>
                      <IndicatorPills indicators={indicatorLabels} />
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">Timeline & Simulare</p>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm">
                <label className="text-slate-300" htmlFor="sim-days">
                  Zile
                </label>
                <input
                  id="sim-days"
                  type="number"
                  min={1}
                  max={60}
                  value={simDays}
                  onChange={(event) =>
                    setSimDays(Math.max(1, Math.min(60, Number(event.target.value) || 1)))
                  }
                  className="w-24 rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm"
                />
              </div>
              <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={!selectedUserId || !canSimulate || simulatePending}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white disabled:opacity-60"
                >
                  {simulatePending ? "Simulăm…" : "Simulează progres"}
                </button>
                {!canSimulate ? <span>Simularea este disponibilă doar pentru contul tău.</span> : null}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                {SESSION_FILTERS.map((filter) => (
                  <label key={filter.id} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sessionTypeFilter[filter.id] ?? true}
                      onChange={() =>
                        setSessionTypeFilter((prev) => ({
                          ...prev,
                          [filter.id]: !(prev[filter.id] ?? true),
                        }))
                      }
                    />
                    {filter.label}
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span>Origine:</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs"
                  value={originFilter}
                  onChange={(event) => setOriginFilter(event.target.value as "all" | TelemetryOrigin)}
                >
                  {ORIGIN_FILTERS.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-400">Nu există date.</p>
            ) : (
              <div className="space-y-6">
                {timeline.map((day) => (
                  <div key={day.dateKey}>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-300">{day.label}</p>
                    <ul className="mt-2 space-y-2">
                      {day.entries.map((entry) => (
                        <li
                          key={entry.id}
                          className="mt-2 flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm"
                        >
                          <SessionBadges flowTag={entry.flowTag} origin={entry.origin} sessionType={entry.sessionType} />
                          <p className="text-slate-100">
                            {entry.time} · {entry.moduleId ?? "—"}
                          </p>
                          {entry.traitPrimaryLabel ? (
                            <p className="text-slate-300">
                              Trait: {entry.traitPrimaryLabel}
                              {entry.traitSecondaryLabel ? ` (secundar: ${entry.traitSecondaryLabel})` : ""}
                            </p>
                          ) : null}
                          <p className="text-slate-300">Arc: {entry.arcId ?? "—"}</p>
                          <p className="text-slate-300">
                            Feedback: {entry.difficulty ?? "—"} · XP: {entry.xpGain > 0 ? `+${entry.xpGain} XP` : "—"}
                          </p>
                          <IndicatorPills indicators={entry.indicators} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

type FlowSummaryCardProps = {
  title: string;
  copy: string;
  accentClass: string;
  borderClass: string;
};

function FlowSummaryCard({ title, copy, accentClass, borderClass }: FlowSummaryCardProps) {
  return (
    <div className={clsx("rounded-lg border bg-slate-950/70 p-3", borderClass)}>
      <div className={clsx("text-xs font-semibold uppercase tracking-wide", accentClass)}>{title}</div>
      <div className="mt-1 text-sm text-slate-100">{copy}</div>
    </div>
  );
}

type SessionBadgeProps = {
  sessionType: string;
  origin: TelemetryOrigin;
  flowTag?: string | null;
};

function SessionBadges({ sessionType, origin, flowTag }: SessionBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase">
      <span className="rounded-full bg-sky-900/60 px-2 py-0.5 text-sky-300">{sessionType}</span>
      <span
        className={clsx(
          "rounded-full px-2 py-0.5",
          origin === "real" ? "bg-emerald-900/70 text-emerald-300" : "border border-slate-500 bg-slate-800 text-slate-300",
        )}
      >
        {origin === "real" ? "Real" : "Simulat"}
      </span>
      {flowTag ? (
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{flowTag}</span>
      ) : null}
    </div>
  );
}

type IndicatorPillsProps = {
  indicators: string[];
};

function IndicatorPills({ indicators }: IndicatorPillsProps) {
  if (!indicators.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-slate-300">
      <span className="mr-1 text-slate-500">Indicatori:</span>
      {indicators.map((indicator) => (
        <span key={indicator} className="rounded-full bg-indigo-900/60 px-2 py-0.5 text-indigo-300">
          {indicator}
        </span>
      ))}
    </div>
  );
}

function formatIndicatorLabels(indicators: string[], moduleId?: string | null): string[] {
  const filtered = indicators.filter((indicator) => indicator && indicator !== moduleId);
  const unique = Array.from(new Set(filtered));
  return unique.map((indicator) => KPI_LABEL_MAP[indicator] ?? indicator);
}

function mergeUniqueUsers(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

function getSessionDate(session: SessionTelemetry): Date | null {
  const recorded = normalizeDate((session as { recordedAt?: unknown })?.recordedAt);
  if (recorded) return recorded;
  if (session.recordedAtOverride instanceof Date) return session.recordedAtOverride;
  return null;
}

function getSessionDateKey(session: SessionTelemetry): string | null {
  const date = getSessionDate(session);
  return date ? getTodayKey(date) : null;
}

type SessionTraitInfo = {
  traitPrimary: CatAxisId | null;
  traitSecondary: CatAxisId | null;
  traitPrimaryLabel: string | null;
  traitSecondaryLabel: string | null;
};

function resolveSessionTraitInfo(session: SessionTelemetry): SessionTraitInfo {
  const definition = getWowLessonDefinition(session.moduleId ?? null);
  const arc = session.arcId ? getArcById(session.arcId) : null;
  const traitPrimary = definition?.traitPrimary ?? (arc?.traitPrimary ?? null);
  const traitSecondary = definition?.traitSecondary ?? (arc?.traitSecondary?.[0] ?? null);
  return {
    traitPrimary,
    traitSecondary,
    traitPrimaryLabel: traitPrimary ? TRAIT_LABELS[traitPrimary] ?? traitPrimary : null,
    traitSecondaryLabel: traitSecondary ? TRAIT_LABELS[traitSecondary] ?? traitSecondary : null,
  };
}

function buildTimeline(data: SessionTelemetry[]): TimelineEntry[] {
  const buckets = new Map<string, TimelineEntry>();
  data.forEach((session) => {
    const recordedAt = getSessionDate(session);
    const dateKey = recordedAt ? getTodayKey(recordedAt) : "unknown";
    const label = recordedAt
      ? recordedAt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
      : "Fără dată";
    if (!buckets.has(dateKey)) {
      buckets.set(dateKey, { dateKey, label, entries: [] });
    }
    const day = buckets.get(dateKey)!;
    const timeLabel = recordedAt
      ? recordedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      : "—";
    const indicatorLabels = formatIndicatorLabels(
      session.kpiEvents?.map((event) => event.indicatorId).filter(Boolean) ?? [],
      session.moduleId,
    );
    const xpGain = session.sessionType === "daily" ? 10 : 0;
    const traitInfo = resolveSessionTraitInfo(session);
    day.entries.push({
      id: session.sessionId,
      time: timeLabel,
      sessionType: session.sessionType,
      origin: session.origin ?? "real",
      flowTag: session.flowTag ?? null,
      arcId: session.arcId ?? null,
      moduleId: session.moduleId ?? null,
      difficulty: session.difficultyFeedback ?? null,
      indicators: indicatorLabels,
      xpGain,
      sortKey: recordedAt ? recordedAt.getTime() : 0,
      traitPrimaryLabel: traitInfo.traitPrimaryLabel,
      traitSecondaryLabel: traitInfo.traitSecondaryLabel,
    });
  });
  return Array.from(buckets.values())
    .map((day) => ({
      ...day,
      entries: [...day.entries].sort((a, b) => b.sortKey - a.sortKey),
    }))
    .sort((a, b) => (a.dateKey > b.dateKey ? -1 : 1));
}

function buildArcCoverageData(
  sessions: SessionTelemetry[],
  snapshot: UserProfileSnapshot | null,
): ArcCoverageRow[] {
  const statsMap = new Map<string, { modules: Set<string>; sessions: number }>();
  sessions.forEach((session) => {
    const arcId = session.arcId;
    if (!arcId) return;
    const entry = statsMap.get(arcId) ?? { modules: new Set<string>(), sessions: 0 };
    if (session.moduleId) {
      entry.modules.add(session.moduleId);
    }
    entry.sessions += 1;
    statsMap.set(arcId, entry);
  });

  return ARC_CONFIGS.map((arc) => {
    const stats = statsMap.get(arc.id);
    const uniqueModulesCompleted = stats ? stats.modules.size : 0;
    const sessionsCount = stats?.sessions ?? 0;
    const xpEstimate = sessionsCount * 10;
    const isActive = snapshot?.activeArcId === arc.id;
    const isCompleted = Boolean(isActive && snapshot?.activeArcCompleted);
    return {
      arcId: arc.id,
      label: `${arc.name} (${arc.id})`,
      totalModules: arc.moduleIds?.length ?? 0,
      uniqueModulesCompleted,
      sessionsCount,
      xpEstimate,
      isActive,
      isCompleted,
    } satisfies ArcCoverageRow;
  });
}

function buildTraitCoverageData(
  sessions: SessionTelemetry[],
  snapshot: UserProfileSnapshot | null,
): TraitCoverageRow[] {
  const traitStats = new Map<CatAxisId, { count: number; last: Date | null }>();
  sessions.forEach((session) => {
    const trait = resolveSessionTraitInfo(session).traitPrimary;
    if (!trait) return;
    const stat = traitStats.get(trait) ?? { count: 0, last: null };
    stat.count += 1;
    const date = getSessionDate(session);
    if (date && (!stat.last || date > stat.last)) {
      stat.last = date;
    }
    traitStats.set(trait, stat);
  });
  const xpByTrait = snapshot?.xpByTrait ?? {};
  return (Object.keys(TRAIT_LABELS) as CatAxisId[])
    .map((trait) => {
      const stat = traitStats.get(trait);
      const xp = xpByTrait[trait] ?? 0;
      const sessionsCount = stat?.count ?? 0;
      if (xp <= 0 && sessionsCount <= 0) return null;
      return {
        trait,
        label: TRAIT_LABELS[trait] ?? trait,
        xp,
        sessions: sessionsCount,
        lastSessionAt: stat?.last ?? null,
      } satisfies TraitCoverageRow;
    })
    .filter(Boolean) as TraitCoverageRow[];
}

function buildActiveArcProgressData(
  sessions: SessionTelemetry[],
  snapshot: UserProfileSnapshot | null,
): ActiveArcProgressData | null {
  let targetArcId = snapshot?.activeArcId ?? null;
  if (!targetArcId) {
    targetArcId = findMostRecentArcId(sessions);
  }
  if (!targetArcId) return null;
  const arcSessions = sessions.filter((session) => session.arcId === targetArcId);
  if (!arcSessions.length) return null;
  const arc = getArcById(targetArcId);
  const trait = (arc?.traitPrimary ?? "clarity") as CatAxisId;
  const traitLabel = TRAIT_LABELS[trait] ?? trait;
  const dates = arcSessions
    .map((session) => getSessionDate(session))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());
  const firstSessionAt = dates[0] ?? null;
  const lastSessionAt = dates[dates.length - 1] ?? null;
  const dayKeys = new Set(arcSessions.map((session) => getSessionDateKey(session)).filter(Boolean));
  const xpCurrent = snapshot?.xpByTrait?.[trait] ?? 0;
  const catAfter = snapshot?.catProfile?.axes?.[trait]?.score ?? null;
  return {
    arcLabel: arc ? `${arc.name} (${arc.id})` : targetArcId,
    traitLabel,
    sessionsCount: arcSessions.length,
    daysActive: dayKeys.size,
    xpStart: 0,
    xpCurrent,
    firstSessionAt,
    lastSessionAt,
    catBefore: null,
    catAfter,
  } satisfies ActiveArcProgressData;
}

function findMostRecentArcId(sessions: SessionTelemetry[]): string | null {
  let latestArcId: string | null = null;
  let latestTimestamp = 0;
  sessions.forEach((session) => {
    if (!session.arcId) return;
    const date = getSessionDate(session);
    if (!date) return;
    const timestamp = date.getTime();
    if (!latestArcId || timestamp > latestTimestamp) {
      latestArcId = session.arcId;
      latestTimestamp = timestamp;
    }
  });
  return latestArcId;
}
