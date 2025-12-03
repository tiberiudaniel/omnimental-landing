"use client";

import { useMemo } from "react";
import type { ProgressFact } from "@/lib/progressFacts";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";

type OmniAbilReplayCardProps = {
  lang: "ro" | "en";
};

function computeReplayCopy(lang: "ro" | "en", facts: ProgressFact | null | undefined) {
  const abil = facts?.omni?.abil;
  if (!abil) {
    return {
      headline: lang === "ro" ? "Ce merită repetat" : "What is worth replaying",
      body:
        lang === "ro"
          ? "După ce marchezi câteva misiuni OmniAbil ca făcute, aici vei primi sugestii simple despre ce merită repetat pentru stabilitate."
          : "Once you complete a few OmniAbil missions, you’ll see simple suggestions here about what’s worth replaying for stability.",
      hint: null as string | null,
    };
  }

  const daily = abil.dailyCompletedThisWeek ?? 0;
  const weekly = abil.weeklyCompletedThisMonth ?? 0;
  const lastDate = abil.lastCompletedDate;
  let daysSince = NaN;

  if (typeof lastDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(lastDate)) {
    const [y, m, d] = lastDate.split("-").map((x) => Number(x));
    const last = new Date(Date.UTC(y, m - 1, d));
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const diffMs = todayUtc.getTime() - last.getTime();
    daysSince = Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  const headline = lang === "ro" ? "Ce merită repetat săptămâna asta" : "What to replay this week";

  if (!Number.isFinite(daysSince)) {
    return {
      headline,
      body:
        lang === "ro"
          ? "Ai început să lucrezi cu OmniAbil. Încearcă să repeți misiunea zilnică de 2–3 ori pe săptămână. După câteva zile, aici vei vedea un ghid mai precis."
          : "You’ve started using OmniAbil. Try to repeat the daily mission 2–3 times per week. After a few days, you’ll see more precise guidance here.",
      hint:
        lang === "ro"
          ? `Până acum: ${daily} misiuni zilnice în această săptămână, ${weekly} săptămânale în această lună.`
          : `So far: ${daily} daily missions this week, ${weekly} weekly missions this month.`,
    };
  }

  if (daysSince <= 1) {
    if (daily >= 3) {
      return {
        headline,
        body:
          lang === "ro"
            ? "Ești deja pe un pattern bun. Continuă cu aceeași misiune zilnică sau o variantă foarte apropiată, fără să crești durata. Stabilitatea contează mai mult decât complexitatea."
            : "You’re already on a solid pattern. Repeat the same daily mission or a very similar version without increasing duration. Stability matters more than complexity.",
        hint:
          lang === "ro"
            ? `În această săptămână ai marcat ${daily} misiuni zilnice și ${weekly} săptămânale.`
            : `This week you’ve completed ${daily} daily and ${weekly} weekly missions.`,
      };
    }
    return {
      headline,
      body:
        lang === "ro"
          ? "Ai misiuni recente marcate ca făcute. Repetă azi o versiune simplă a aceleiași misiuni – chiar dacă doar 5–10 minute. Repetiția creează siguranță și automatism."
          : "You’ve completed missions recently. Replay a simple version of the same mission today – even just 5–10 minutes. Repetition builds safety and automaticity.",
      hint:
        lang === "ro"
          ? "Ținta realistă: 3 misiuni zilnice pe săptămână și 1–2 misiuni săptămânale pe lună."
          : "Realistic target: 3 daily missions per week and 1–2 weekly missions per month.",
    };
  }

  if (daysSince <= 4) {
    return {
      headline,
      body:
        lang === "ro"
          ? `Au trecut ${daysSince} zile de când ai făcut ultima misiune OmniAbil. Reia azi cea mai simplă versiune a misiunii zilnice (maxim 10 minute) și marcheaz-o ca făcută. Nu trebuie să „recuperezi”.`
          : `${daysSince} days have passed since your last OmniAbil mission. Today, replay the simplest version of your daily mission (max 10 minutes) and mark it done. You don’t need to “catch up”.`,
      hint:
        lang === "ro"
          ? "Te poți concentra doar pe azi. Restul săptămânii poate rămâne simplă: încă 1–2 misiuni mici, nu mai mult."
          : "Focus on today only. The rest of the week can stay light: 1–2 more small missions, nothing more.",
    };
  }

  return {
    headline,
    body:
      lang === "ro"
        ? `Nu ai mai marcat o misiune OmniAbil de ${daysSince} zile. Nu este un eșec, ci un semnal. Alege azi cea mai mică formă posibilă de misiune (90 de secunde sau 5 minute), marcheaz-o și lasă asta să fie noul tău punct de relansare.`
        : `It has been ${daysSince} days since your last OmniAbil mission. This is not a failure, it’s a signal. Today, choose the smallest possible mission (90 seconds or 5 minutes), mark it done, and let that be your new restart point.`,
    hint:
      lang === "ro"
        ? "Ținta nu este perfecțiunea, ci să apari din nou. O singură misiune azi contează mai mult decât 7 „recuperate” mâine."
        : "The goal isn’t perfection, it’s to show up again. One mission today matters more than 7 “recovered” tomorrow.",
  };
}

export function OmniAbilReplayCard({ lang }: OmniAbilReplayCardProps) {
  const { profile } = useProfile();
  const { data: facts, loading } = useProgressFacts(profile?.id ?? null);

  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";
  const { headline, body, hint } = useMemo(
    () => computeReplayCopy(normalizedLang, facts),
    [normalizedLang, facts],
  );

  return (
    <section className="omni-card rounded-card bg-[var(--omni-surface-card)]/95 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.06)] sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
        {normalizedLang === "ro" ? "Replay recomandat" : "Recommended replay"}
      </p>
      <h2 className="mt-2 text-[15px] font-semibold text-[var(--omni-ink)]">{headline}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--omni-ink-soft)]">{body}</p>
      {hint ? <p className="mt-3 text-[11px] text-[var(--omni-muted)]">{hint}</p> : null}
      {loading ? (
        <p className="mt-3 text-[11px] text-[var(--omni-muted)]">
          {normalizedLang === "ro"
            ? "Actualizăm datele tale de progres..."
            : "Updating your progress data..."}
        </p>
      ) : null}
    </section>
  );
}
