"use client";

import { Card } from "@/components/ui/card";
import { useProfile } from "@/components/ProfileProvider";
import type { OmniAbilTask } from "@/lib/omniAbilTasks";
import { useOmniAbilTasks } from "@/components/dashboard/useOmniAbilTasks";

export function OmniAbilCard({ lang }: { lang: string }) {
  const { profile } = useProfile();
  const { daily, weekly, loading, isEmpty, markTask, markingId } = useOmniAbilTasks(profile?.id);

  const renderTask = (task: OmniAbilTask | null, type: "daily" | "weekly") => {
    if (!task) {
      const fallback =
        lang === "ro"
          ? type === "daily"
            ? "Nu ai încă o misiune zilnică. Revin-o mai târziu."
            : "Misiunea săptămânală va apărea după primele zile."
          : type === "daily"
          ? "No daily mission yet. Check back later."
          : "The weekly mission appears after your first daily tasks.";
      return <p className="text-sm text-[var(--omni-muted)]">{fallback}</p>;
    }
    const isDone = task.status === "done";
    const xpLabel = task.xpReward ? `+${task.xpReward} XP` : null;
    return (
      <div className="rounded-card border border-[#EFE4D8] bg-[var(--omni-surface-card)]/90 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-[var(--omni-ink)]">{task.title}</p>
            {task.description ? <p className="text-[11px] text-[var(--omni-muted)]">{task.description}</p> : null}
            {xpLabel ? <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">{xpLabel}</p> : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                isDone ? "text-[#1F7A43]" : "text-[var(--omni-muted)]"
              }`}
            >
              {isDone ? (lang === "ro" ? "Făcut" : "Done") : lang === "ro" ? "În curs" : "Pending"}
            </span>
            <button
              type="button"
              onClick={() => markTask(task)}
              disabled={isDone || markingId === task.id}
              className={`rounded-cta px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                isDone
                  ? "border border-transparent bg-[#E8E1D6] text-[#8A7A68]"
                  : "border border-[#C5B29E] text-[var(--omni-ink-soft)] hover:border-[#8B5A3A]"
              } disabled:opacity-60`}
            >
              {isDone ? (lang === "ro" ? "Marcat" : "Completed") : lang === "ro" ? "Marchează ca făcut" : "Mark done"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card
      className="border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-3 sm:p-4"
      data-testid="omniabil-card"
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">OmniAbil</p>
          <p className="text-base font-semibold text-[var(--omni-ink)]">
            {lang === "ro" ? "Misiuni de implementare" : "Implementation missions"}
          </p>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-[var(--omni-muted)]">{lang === "ro" ? "Se încarcă misiunile..." : "Loading missions..."}</p>
      ) : isEmpty ? (
        <p className="text-sm text-[var(--omni-muted)]">
          {lang === "ro"
            ? "Nu ai niciun task activ azi. În Season 1, vei primi misiuni zilnice de implementare."
            : "No active tasks today. In Season 1 you’ll receive daily implementation missions."}
        </p>
      ) : (
        <div className="space-y-3">
          <section data-testid="omniabil-daily">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
              {lang === "ro" ? "Misiunea zilnică" : "Daily mission"}
            </p>
            {renderTask(daily, "daily")}
          </section>
          <section>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
              {lang === "ro" ? "Misiunea săptămânală" : "Weekly mission"}
            </p>
            {renderTask(weekly, "weekly")}
          </section>
        </div>
      )}
    </Card>
  );
}
