"use client";

import type { OmniKunoModuleConfig } from "@/config/omniKunoLessons";
import type { KunoTimelineItem } from "./useKunoTimeline";
import { asDifficulty, DIFFICULTY_STYLES } from "./difficulty";
import { getLessonDuration, getLessonObjective } from "./lessonUtils";
import { useMemo } from "react";

type TranslatorFn = (key: string) => string | number | undefined;

type ModuleOverviewDialogProps = {
  open: boolean;
  onClose: () => void;
  timeline: KunoTimelineItem[];
  module: OmniKunoModuleConfig;
  lang: string;
  t: TranslatorFn;
  onSelectLesson?: (lessonId: string) => void;
};

export function ModuleOverviewDialog({ open, onClose, timeline, module, lang, t, onSelectLesson }: ModuleOverviewDialogProps) {
  const sorted = useMemo(() => timeline.slice().sort((a, b) => a.order - b.order), [timeline]);
  if (!open) return null;
  const statusLabel = (status: KunoTimelineItem["status"]) => {
    if (status === "done") return lang === "ro" ? "Finalizată" : "Completed";
    if (status === "active") return lang === "ro" ? "În desfășurare" : "In progress";
    return lang === "ro" ? "Blocat până finalizezi pașii anteriori" : "Locked until previous steps are done";
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/30 px-4 py-10" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] shadow-[0_25px_60px_rgba(0,0,0,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#F0E8E0] px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">{lang === "ro" ? "Harta misiunilor" : "Mission map"}</p>
            <h3 className="mt-1 text-xl font-semibold text-[var(--omni-ink)]">
              {lang === "ro" ? "Vezi toate misiunile" : "View all missions"}
            </h3>
            <p className="text-sm text-[var(--omni-muted)]">
              {lang === "ro"
                ? "Poți re-deschide orice misiune finalizată sau activă. Cele blocate vor porni automat după ce închei pasul curent."
                : "Reopen any completed or active mission. Locked ones will unlock right after you finish the current step."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-sm font-semibold text-[var(--omni-muted)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
            aria-label={lang === "ro" ? "Închide overview" : "Close overview"}
          >
            ×
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <ul className="space-y-2">
            {sorted.map((item) => {
              const lesson = module.lessons.find((entry) => entry.id === item.id);
              if (!lesson) return null;
              const disabled = item.status === "locked";
              const objective = getLessonObjective(lesson, lang);
              const difficultyKey = asDifficulty(item.difficulty);
              const difficultyLabelRaw = t(`omnikuno.difficulty.${difficultyKey}Label`);
              const difficultyLabel =
                typeof difficultyLabelRaw === "string" || typeof difficultyLabelRaw === "number"
                  ? difficultyLabelRaw
                  : difficultyKey;
              const duration = getLessonDuration(lesson);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (disabled) return;
                      onSelectLesson?.(item.id);
                    }}
                    disabled={disabled}
                    className={`flex w-full items-center justify-between gap-4 rounded-card border px-4 py-3 text-left transition ${
                      disabled
                        ? "border-[#F0E8E0] bg-[var(--omni-surface-card)]/70 text-[#B0A295]"
                        : "border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] hover:border-[var(--omni-energy)] hover:shadow-[0_14px_40px_rgba(192,121,99,0.15)]"
                    }`}
                  >
                    <div>
                      <p className="text-base font-semibold text-[var(--omni-ink)]">
                        {item.order}. {item.title}
                      </p>
                      <p className="text-[12px] text-[var(--omni-muted)]">{objective}</p>
                      <p className="text-[11px] text-[#9A8777]">{statusLabel(item.status)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-[var(--omni-muted)]">
                      <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] ${DIFFICULTY_STYLES[difficultyKey].badge}`}>
                        {String(difficultyLabel)}
                      </span>
                      {duration ? (
                        <span>
                          {lang === "ro" ? "Durată" : "Duration"} ~{duration} min
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
