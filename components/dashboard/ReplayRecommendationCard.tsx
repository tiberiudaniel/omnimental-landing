import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ReplayRecommendationPayload } from "@/lib/types/replay";

type ReplayRecommendationCardProps = {
  lang: "ro" | "en";
  recommendation: ReplayRecommendationPayload | null;
  loading: boolean;
  error: string | null;
  title?: string;
  subtitle?: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string | { pathname: string; query?: Record<string, string> };
  fallbackReason?: string;
};

const REASON_MAP: Partial<Record<ReplayRecommendationPayload["reason"], string>> = {
  low_score: "Let’s reinforce the last lesson with more focus.",
  superficial: "Last run was too fast — replay to add more depth.",
  deep_no_action: "Great insights, now anchor them through action.",
  consistency: "Consistency boost: revisit to consolidate the wins.",
  returning: "Ease back in: mini replay to regain rhythm.",
};

export function ReplayRecommendationCard({
  lang,
  recommendation,
  loading,
  error,
  title,
  subtitle,
  badge,
  ctaLabel,
  ctaHref,
  fallbackReason,
}: ReplayRecommendationCardProps) {
  const href =
    ctaHref ??
    ({
      pathname: recommendation?.moduleId ? `/replay/module/${recommendation.moduleId}` : "/progress",
    } as const);
  const reason =
    (recommendation?.reason ? REASON_MAP[recommendation.reason] : null) ??
    fallbackReason ??
    (lang === "ro" ? "Reluare manuală pentru testarea fundației." : "Manual replay entry for foundation testing.");
  const helperNote =
    error && !recommendation
      ? error
      : lang === "ro"
        ? "Selectează lecția sugerată mai jos pentru a relua modulul."
        : "Use the CTA below to replay the module.";

  return (
    <Card className="rounded-2xl border-2 border-[var(--omni-energy)] bg-[color-mix(in_srgb,var(--omni-energy)_6%,white)] px-4 py-4 shadow-lg sm:px-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xl font-bold tracking-tight text-[var(--omni-ink)]">
          {title ?? "Replay (Phase 1)"}
        </p>
        {badge ? (
          <span className="rounded-full border border-dashed border-[var(--omni-ink-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink-soft)]">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-[var(--omni-muted)]">{subtitle ?? "Basic replay entry point — foundation layer"}</p>
      {loading ? (
        <p className="mt-3 text-[12px] text-[var(--omni-muted)]">
          {lang === "ro" ? "Se pregătește recomandarea…" : "Preparing replay entry point…"}
        </p>
      ) : (
        <>
          <div className="mt-3 rounded-2xl border border-dashed border-[var(--omni-border-soft)] bg-white/80 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
              {lang === "ro" ? "Motivul replay" : "Replay driver"}
            </p>
            <p className="text-sm text-[var(--omni-ink)]">
              {typeof reason === "string" ? reason : String(reason)}
            </p>
            {helperNote ? (
              <p className="mt-1 text-[11px] text-[var(--omni-muted)]">{helperNote}</p>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={href}
              className="inline-flex items-center rounded-full border border-[var(--omni-ink)] bg-[var(--omni-ink)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:translate-y-[-1px]"
            >
              {ctaLabel ?? "Replay last completed lesson"}
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}
