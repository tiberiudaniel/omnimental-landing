import type { ProgressFact } from "@/lib/progressFacts";
import { computeActionTrend, type ActivityEvent, type extractSessions } from "@/lib/progressAnalytics";

export type OmniAbilSnapshot = {
  badge: { text: string; cls: string };
  primary: {
    title: string;
    href: { pathname: string; query?: Record<string, string | string[] | undefined> };
    dur: string;
  };
  primaryDesc: string;
  alt1: string;
  alt2: string;
  energy: number;
  stress: number;
  clarity: number;
  why: string;
};

export function buildOmniAbilSnapshot({
  lang,
  facts,
  sessions,
  refMs,
  currentFocusTag,
  nowAnchor,
}: {
  lang: string;
  facts: ProgressFact | null;
  sessions: ReturnType<typeof extractSessions>;
  refMs: number;
  currentFocusTag?: string;
  nowAnchor: number;
}): OmniAbilSnapshot {
  const last = (facts?.quickAssessment ?? null) as
    | { energy?: number; stress?: number; clarity?: number; confidence?: number; focus?: number; updatedAt?: unknown }
    | null;
  const clampScore = (value: unknown) => Math.max(0, Math.min(10, Number(value ?? 0)));
  const energyQA = clampScore(last?.energy);
  const stressQA = clampScore(last?.stress);
  const clarityQA = clampScore(last?.clarity);

  type ScopeHist = Record<string, { clarity?: number; calm?: number; energy?: number; updatedAt?: unknown }>;
  const scopeHist = ((facts as { omni?: { scope?: { history?: ScopeHist } } } | undefined)?.omni?.scope?.history ?? {}) as ScopeHist;
  const lastKeys = Object.keys(scopeHist)
    .filter((k) => /^d\d{8}$/.test(k))
    .sort()
    .slice(-3);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const energy3 = avg(lastKeys.map((k) => Number(scopeHist[k]?.energy ?? 0)));
  const clarity3 = avg(lastKeys.map((k) => Number(scopeHist[k]?.clarity ?? 0)));
  const calm3 = avg(lastKeys.map((k) => Number(scopeHist[k]?.calm ?? 0)));

  const toMs = (v: unknown) => {
    try {
      if (!v) return 0;
      if (typeof v === "number") return v;
      if (v instanceof Date) return v.getTime();
      const ts = v as { toDate?: () => Date };
      return typeof ts?.toDate === "function" ? ts.toDate().getTime() : 0;
    } catch {
      return 0;
    }
  };
  const qaMs = toMs(last?.updatedAt);
  const histMs = (() => {
    const lastKey = lastKeys[lastKeys.length - 1];
    const u = lastKey ? scopeHist[lastKey]?.updatedAt : undefined;
    return toMs(u);
  })();
  const preferQA = qaMs && (!histMs || qaMs >= histMs);

  const evs: ActivityEvent[] = (() => {
    const base: ActivityEvent[] = sessions.map((s) => ({
      startedAt: ((): number | string | Date => {
        const v = (s as { startedAt?: unknown })?.startedAt;
        if (typeof v === "number" || v instanceof Date || typeof v === "string") return v as number | string | Date;
        return nowAnchor;
      })(),
      durationMin: Math.max(0, Math.round((s.durationSec ?? 0) / 60)),
      units: 1,
      source: (s.type === "breathing" ? "breathing" : s.type === "drill" ? "drill" : "journal") as ActivityEvent["source"],
      category: (s.type === "reflection" ? "reflection" : "practice") as ActivityEvent["category"],
    }));
    try {
      type RawAE = { startedAt?: unknown; source?: string; category?: "knowledge" | "practice" | "reflection"; units?: number; durationMin?: number; focusTag?: string | null };
      const raws = (facts as { activityEvents?: RawAE[] } | undefined)?.activityEvents ?? [];
      raws.forEach((r) => {
        if (!r.category) return;
        const started: number | string | Date =
          typeof r.startedAt === "number" || r.startedAt instanceof Date || typeof r.startedAt === "string"
            ? (r.startedAt as number | string | Date)
            : nowAnchor;
        const src: ActivityEvent["source"] = (() => {
          const s = r.source || "other";
          return ["omnikuno", "omniabil", "breathing", "journal", "drill", "slider", "other"].includes(s) ? (s as ActivityEvent["source"]) : "other";
        })();
        base.push({
          startedAt: started,
          durationMin: typeof r.durationMin === "number" ? r.durationMin : undefined,
          units: typeof r.units === "number" ? r.units : 1,
          source: src,
          category: r.category,
          focusTag: r.focusTag ?? undefined,
        });
      });
    } catch {}
    return base;
  })();
  const todayScore = computeActionTrend(evs, refMs, lang, 1, currentFocusTag)[0]?.totalMin ?? 0;

  const energy = preferQA ? energyQA : energy3;
  const stress = preferQA ? stressQA : 10 - calm3;
  const clarity = preferQA ? clarityQA : clarity3;
  const state: "low" | "tense" | "ready" =
    energy <= 4 ? "low" : (10 - stressQA <= 3 && preferQA ? "tense" : (preferQA ? 10 - stressQA : calm3) <= 4 ? "tense" : "ready");
  const badge = (() => {
    if (state === "low") return { text: lang === "ro" ? "ENERGIE SCĂZUTĂ" : "LOW ENERGY", cls: "bg-[#FFF1ED] text-[#B8472B] border-[#F3D3C6]" };
    if (state === "tense") return { text: lang === "ro" ? "STARE TENSIONATĂ" : "TENSE STATE", cls: "bg-[#FFEFF3] text-[#B82B4F] border-[#F6D0DA]" };
    return { text: lang === "ro" ? "PREGĂTIT" : "READY", cls: "bg-[#ECF8F0] text-[#1F7A43] border-[#CFEBDD]" };
  })();

  const primary = (() => {
    if (state === "low")
      return {
        title: lang === "ro" ? "Respirație 5 minute pentru reset" : "5‑min breath reset",
        href: { pathname: "/antrenament", query: { tab: "ose" } },
        dur: "~5 min",
      } as const;
    if (state === "tense")
      return {
        title: lang === "ro" ? "Jurnal ghidat: descarcă emoțiile (5 min)" : "Guided journal: release tension (5 min)",
        href: { pathname: "/progress", query: { open: "journal", tab: "NOTE_LIBERE" } },
        dur: "~5 min",
      } as const;
    return {
      title: lang === "ro" ? "Mini‑lecție OmniKuno pe tema ta" : "OmniKuno micro‑lesson on your theme",
      href: { pathname: "/antrenament", query: { tab: "oc" } },
      dur: lang === "ro" ? "3–7 min" : "3–7 min",
    } as const;
  })();

  const primaryDesc = (() => {
    if (state === "tense") {
      return lang === "ro"
        ? "Scrie 2–3 rânduri despre ce te apasă acum. Nu analiza — doar descarcă tensiunea; va ușura claritatea."
        : "Write 2–3 lines about what feels heavy right now. Don’t analyze — just offload the tension to regain clarity.";
    }
    if (state === "low") {
      return lang === "ro"
        ? "Ritm simplu 4–4 (sau 4–6): inspiră 4s, ține 4s, expiră 4s, ține 4s. 3–5 cicluri, cu atenția pe expirație."
        : "Simple 4–4 (or 4–6) rhythm: inhale 4s, hold 4s, exhale 4s, hold 4s. Do 3–5 cycles, focus on the exhale.";
    }
    return lang === "ro"
      ? "3–7 minute: parcurgi o idee-cheie aplicată pe tema ta din focus. 1 concept + 1 exemplu concret."
      : "3–7 minutes: review a key idea applied to your focus theme. 1 concept + 1 concrete example.";
  })();

  const alt1 = lang === "ro" ? "Somn: checklist scurt (2 min)" : "Sleep: short checklist (2 min)";
  const alt2 = lang === "ro" ? "Jurnal: o notă rapidă" : "Journal: a quick note";
  const why = (() => {
    const e = Math.round((energy3 || energy) * 10) / 10;
    const c = Math.round((10 - stress) * 10) / 10;
    const a = todayScore;
    if (lang === "ro")
      return `Îți recomandăm asta pentru că, în ultimele zile, energia ta a fost ~${e}/10, echilibrul emoțional ~${c}/10, iar scorul de acțiune azi este ${a}/100.`;
    return `We recommend this because, in recent days, your energy was ~${e}/10, emotional balance ~${c}/10, and today’s action score is ${a}/100.`;
  })();

  return {
    badge,
    primary,
    primaryDesc,
    alt1,
    alt2,
    energy,
    stress,
    clarity,
    why,
  };
}
