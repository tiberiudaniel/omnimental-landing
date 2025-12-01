import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ReplayRecommendationPayload } from "@/lib/types/replay";

type ReplayRecommendationCardProps = {
  lang: "ro" | "en";
  recommendation: ReplayRecommendationPayload | null;
  loading: boolean;
  error: string | null;
};

const TYPE_LABELS: Record<
  NonNullable<ReplayRecommendationPayload>["replayType"],
  { ro: string; en: string }
> = {
  lesson: { ro: "Lecție", en: "Lesson" },
  category: { ro: "Categorie", en: "Category" },
  cycle: { ro: "Ciclu", en: "Cycle" },
};

const REASON_COPY: Record<
  NonNullable<ReplayRecommendationPayload>["reason"],
  { ro: string; en: string }
> = {
  low_score: {
    ro: "Hai să întărim cunoștințele printr-o nouă repriză scurtă.",
    en: "Let’s reinforce the concept with one more focused pass.",
  },
  superficial: {
    ro: "Ultima dată a mers prea repede. Mai adaugă puțină profunzime.",
    en: "Things moved too fast last time—slow down and go deeper.",
  },
  deep_no_action: {
    ro: "Ai înțeles ideea, acum trad-o în acțiuni practice.",
    en: "Great insights—now turn them into concrete actions.",
  },
  consistency: {
    ro: "Consolidezi progresul când revii la ritmul complet.",
    en: "Consistency locks in progress—time for a full cycle.",
  },
  returning: {
    ro: "Re-start blând pentru a recăpăta ritmul.",
    en: "Ease back in to regain your rhythm.",
  },
};

const MODE_LABELS: Record<
  NonNullable<ReplayRecommendationPayload>["recommendedMode"],
  { title: { ro: string; en: string }; helper: { ro: string; en: string } }
> = {
  guided: {
    title: { ro: "Mod ghidat", en: "Guided mode" },
    helper: {
      ro: "Pași scurți, verificați după fiecare ecran.",
      en: "Short steps with checks after each screen.",
    },
  },
  applied: {
    title: { ro: "Mod aplicat", en: "Applied mode" },
    helper: {
      ro: "Axat pe exerciții rapide, direct în situația ta.",
      en: "Focus on quick actions in your real scenario.",
    },
  },
  reflective: {
    title: { ro: "Mod reflexiv", en: "Reflective mode" },
    helper: {
      ro: "Respiri, notezi și revezi răspunsurile blocante.",
      en: "Breathe, journal, and revisit the blockers.",
    },
  },
};

export function ReplayRecommendationCard({
  lang,
  recommendation,
  loading,
  error,
}: ReplayRecommendationCardProps) {
  const tag = recommendation ? TYPE_LABELS[recommendation.replayType][lang] : lang === "ro" ? "Replay" : "Replay";
  const reason = recommendation ? REASON_COPY[recommendation.reason][lang] : lang === "ro" ? "Completează câteva lecții pentru a primi recomandări personalizate." : "Complete a few lessons to unlock tailored replays.";
  const mode = recommendation ? MODE_LABELS[recommendation.recommendedMode] : null;
  const href = (() => {
    const query: Record<string, string> = {};
    if (recommendation?.moduleId) query.module = recommendation.moduleId;
    if (recommendation?.target) query.lesson = recommendation.target;
    return { pathname: "/omni-kuno", query };
  })();

  return (
    <Card className="rounded-2xl border border-[#F0E8E0] bg-[var(--omni-surface-card)]/90 p-3 shadow-sm sm:p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {lang === "ro" ? "Recomandare replay" : "Replay recommendation"}
        </div>
        <span className="rounded-full bg-[var(--omni-energy-tint)] px-2 py-0.5 text-[10px] font-semibold text-[var(--omni-energy)]">
          {tag}
        </span>
      </div>
      {loading ? (
        <p className="text-[11px] text-[var(--omni-muted)]">{lang === "ro" ? "Se pregătește recomandarea…" : "Preparing your recommendation…"}</p>
      ) : error ? (
        <p className="text-[11px] text-[#B03C2F]">{error}</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-[var(--omni-ink)]">
            {recommendation?.replayType === "cycle"
              ? lang === "ro"
                ? "Reia întregul ciclu pentru claritate completă."
                : "Replay the full cycle for complete clarity."
              : lang === "ro"
                ? "Reia lecția recomandată cu mai mult focus."
                : "Replay the suggested lesson with more focus."}
          </p>
          <p className="mt-1 text-[11px] text-[var(--omni-muted)]">{reason}</p>
          {mode ? (
            <div className="mt-3 rounded-xl border border-dashed border-[var(--omni-border-soft)] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--omni-muted)]">{mode.title[lang]}</p>
              <p className="text-sm text-[var(--omni-ink)]">{mode.helper[lang]}</p>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={href}
              className="inline-flex items-center rounded-full border border-[var(--omni-energy)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-energy)] transition hover:bg-[var(--omni-energy)] hover:text-white"
            >
              {lang === "ro" ? "Reia acum" : "Replay now"}
            </Link>
            <span className="text-[11px] text-[var(--omni-muted)]">
              {recommendation?.estimatedMinutes
                ? lang === "ro"
                  ? `~${recommendation.estimatedMinutes} minute`
                  : `~${recommendation.estimatedMinutes} min`
                : lang === "ro"
                  ? "Scurt și practic."
                  : "Short & practical."}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
