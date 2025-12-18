import { useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import type { UserProfileSnapshot, CatAxisId, CanonDomainId } from "@/lib/profileEngine";

export const TRAIT_LABELS: Record<CatAxisId, string> = {
  clarity: "Claritate",
  focus: "Focus",
  recalibration: "Recalibrare",
  energy: "Energie",
  flexibility: "Flexibilitate",
  adaptiveConfidence: "Încredere adaptativă",
  emotionalStability: "Stabilitate emoțională",
};

const DOMAIN_LABELS: Record<CanonDomainId, string> = {
  decisionalClarity: "Claritate decizională",
  executiveControl: "Control executiv",
  emotionalRegulation: "Reglare emoțională",
  functionalEnergy: "Energie funcțională",
};

const LIFE_DOMAIN_LABELS: Record<string, string> = {
  work: "Muncă",
  personal: "Personal",
  relationships: "Relații",
  growth: "Dezvoltare",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-emerald-300",
  medium: "text-amber-300",
  low: "text-rose-300",
  unknown: "text-slate-400",
};

export function ProfileCard({ title, accent, children }: { title: string; accent: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 space-y-2">
      <p className={clsx("text-xs font-semibold uppercase tracking-wide", accent)}>{title}</p>
      <div className="text-sm text-slate-200">{children}</div>
    </div>
  );
}

export function TraitTable({ snapshot }: { snapshot: UserProfileSnapshot | null }) {
  const axes = snapshot?.catProfile?.axes;
  if (!axes) {
    return <p className="text-xs text-slate-400">Fără date CAT.</p>;
  }
  const entries = Object.entries(axes) as Array<[
    CatAxisId,
    {
      score: number | null;
      confidence: string;
      canonDomain: CanonDomainId;
    },
  ]>;
  return (
    <div className="space-y-1 text-xs">
      {entries.map(([axis, data]) => (
        <div key={axis} className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-950/50 px-2 py-1">
          <div>
            <p className="font-semibold text-slate-200">{TRAIT_LABELS[axis] ?? axis}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              {DOMAIN_LABELS[data.canonDomain] ?? data.canonDomain}
            </p>
          </div>
          <div className="text-right">
            <p
              className={clsx(
                "text-sm font-semibold",
                CONFIDENCE_COLORS[(data.confidence ?? "unknown").toLowerCase()] ?? "text-slate-300",
              )}
            >
              {(data.score ?? 0).toFixed(1)}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{(data.confidence ?? "unknown").toUpperCase()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DomainList({ snapshot }: { snapshot: UserProfileSnapshot | null }) {
  const domains = snapshot?.domains ?? [];
  if (!domains.length) {
    return <p className="text-xs text-slate-400">Fără preferințe de domeniu.</p>;
  }
  return (
    <ul className="space-y-1 text-sm text-slate-200">
      {domains.map((domain) => (
        <li key={domain.domainId} className="flex justify-between border border-slate-800 bg-slate-950/50 px-2 py-1">
          <span>{LIFE_DOMAIN_LABELS[domain.domainId] ?? domain.domainId}</span>
          <span className="text-slate-300">{Math.round((domain.weight ?? 0) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}

export function XpList({ snapshot }: { snapshot: UserProfileSnapshot | null }) {
  const xp = snapshot?.xpByTrait ?? {};
  const entries = Object.entries(xp);
  if (!entries.length) {
    return <p className="text-xs text-slate-400">Nu există XP încă.</p>;
  }
  return (
    <ul className="space-y-1 text-sm text-slate-200">
      {entries.map(([axis, amount]) => (
        <li key={axis} className="flex justify-between border border-slate-800 bg-slate-950/50 px-2 py-1">
          <span>{TRAIT_LABELS[axis as CatAxisId] ?? axis}</span>
          <span className="text-slate-300">{amount ?? 0} XP</span>
        </li>
      ))}
    </ul>
  );
}

export function ArcSubscription({ snapshot }: { snapshot: UserProfileSnapshot | null }) {
  if (!snapshot) {
    return <p className="text-xs text-slate-400">Fără date.</p>;
  }
  const arcId = snapshot.activeArcId;
  const arcLabel = arcId ? arcId.replace(/_/g, " ") : "—";
  const displayDay = snapshot.activeArcDayIndex + 1;
  const totalDays = snapshot.activeArcCompleted ? displayDay : undefined;
  return (
    <div className="space-y-2 text-sm">
      <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">Arc activ</p>
        {arcId ? (
          <div className="space-y-1 text-slate-200">
            <p>{arcLabel}</p>
            <p>
              Ziua {displayDay}
              {typeof totalDays === "number" ? ` / ${totalDays}` : ""}
            </p>
            {snapshot.activeArcCompleted ? (
              <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                Arc completat
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Niciun arc activ.</p>
        )}
      </div>
      <div className="rounded border border-slate-800 bg-slate-950/50 p-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">Abonament</p>
        <p className="text-slate-200">{(snapshot.subscription?.status ?? "free").toUpperCase()}</p>
        <p className="text-xs text-slate-400">Provider: {snapshot.subscription?.provider ?? "manual"}</p>
      </div>
    </div>
  );
}

export function RawJsonViewer({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded border border-slate-800 bg-slate-950/40 p-3 text-xs">
      <button
        type="button"
        className="text-xs font-semibold uppercase tracking-wide text-sky-400"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "Ascunde JSON" : "Vezi JSON brut"}
      </button>
      {open ? (
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-950/80 p-3 text-[10px] text-slate-200">
          {data ? JSON.stringify(data, null, 2) : "—"}
        </pre>
      ) : null}
    </div>
  );
}

export type ArcCoverageRow = {
  arcId: string;
  label: string;
  totalModules: number;
  uniqueModulesCompleted: number;
  sessionsCount: number;
  xpEstimate: number;
  isActive: boolean;
  isCompleted: boolean;
};

export function ArcCoverageCard({ data }: { data: ArcCoverageRow[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Arc coverage</p>
      {data.length === 0 ? (
        <p className="text-xs text-slate-400">Nu există sesiuni pentru arcuri.</p>
      ) : (
        <div className="space-y-2">
          {data.map((arc) => (
            <div key={arc.arcId} className="space-y-1 rounded border border-slate-800 bg-slate-950/50 p-2 text-xs text-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{arc.label}</span>
                <div className="flex gap-2 text-[10px] uppercase tracking-wide">
                  {arc.isActive ? (
                    <span className="rounded-full bg-sky-900/60 px-2 py-0.5 text-sky-200">Activ</span>
                  ) : null}
                  {arc.isCompleted ? (
                    <span className="rounded-full bg-amber-900/60 px-2 py-0.5 text-amber-200">Completat</span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-slate-300">
                <span>Module: {arc.uniqueModulesCompleted} / {arc.totalModules || "—"}</span>
                <span>Sesiuni: {arc.sessionsCount}</span>
                <span>XP (estimare): {arc.xpEstimate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type TraitCoverageRow = {
  trait: CatAxisId;
  label: string;
  xp: number;
  sessions: number;
  lastSessionAt: Date | null;
};

export function TraitCoverageCard({ data }: { data: TraitCoverageRow[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">Trait coverage</p>
      {data.length === 0 ? (
        <p className="text-xs text-slate-400">Nu există sesiuni pe trăsături.</p>
      ) : (
        <div className="space-y-2">
          {data.map((trait) => (
            <div key={trait.trait} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-slate-950/50 px-2 py-1 text-xs text-slate-100">
              <span className="font-semibold">{trait.label}</span>
              <span>XP: {trait.xp}</span>
              <span>Sesiuni: {trait.sessions}</span>
              <span>Ultima: {formatShortDate(trait.lastSessionAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type ActiveArcProgressData = {
  arcLabel: string;
  traitLabel: string;
  sessionsCount: number;
  daysActive: number;
  xpStart: number;
  xpCurrent: number;
  firstSessionAt: Date | null;
  lastSessionAt: Date | null;
  catBefore: number | null;
  catAfter: number | null;
};

export function ActiveArcProgressCard({ data }: { data: ActiveArcProgressData | null }) {
  return (
    <div className="rounded-xl border border-emerald-600/70 bg-emerald-950/40 p-3 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Progres Arc activ</p>
      {!data ? (
        <p className="text-xs text-emerald-200">Nu există date suficiente.</p>
      ) : (
        <div className="space-y-1 text-sm text-emerald-100">
          <p>{data.arcLabel} · Trait: {data.traitLabel}</p>
          <p>Sesiuni: {data.sessionsCount} (în {data.daysActive} zile)</p>
          <p>XP: {data.xpStart} → {data.xpCurrent}</p>
          <p>
            Primele sesiuni: {formatShortDate(data.firstSessionAt)} · Ultima: {formatShortDate(data.lastSessionAt)}
          </p>
          {typeof data.catBefore === "number" || typeof data.catAfter === "number" ? (
            <p>Scor CAT: {data.catBefore ?? "—"} → {data.catAfter ?? "—"}</p>
          ) : (
            <p>Scor CAT: date insuficiente</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatShortDate(date: Date | null) {
  if (!date) return "—";
  try {
    return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" });
  } catch {
    return date.toLocaleDateString();
  }
}
