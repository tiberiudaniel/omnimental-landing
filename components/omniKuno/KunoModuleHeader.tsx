"use client";

import { useI18n } from "@/components/I18nProvider";
import InfoTooltip from "@/components/InfoTooltip";

type KunoModuleHeaderProps = {
  title: string;
  focusLabel: string;
  moduleLevelLabel: string;
  progressSummary: string;
  adaptiveMessage: string | null;
  onDismissAdaptive: () => void;
  overviewLabel?: string;
  onOpenOverview?: () => void;
};

export function KunoModuleHeader({
  title,
  focusLabel,
  moduleLevelLabel,
  progressSummary,
  adaptiveMessage,
  onDismissAdaptive,
  overviewLabel,
  onOpenOverview,
}: KunoModuleHeaderProps) {
  const { t } = useI18n();
  const adaptiveCopy = String(t("omnikuno.adaptive.headerExplainerShort"));
  const adaptiveTooltip = String(t("omnikuno.adaptive.tooltip"));
  const adaptiveLabel = String(t("omnikuno.adaptive.headerExplainer"));
  return (
    <header className="rounded-2xl border border-[#E4DAD1] bg-white px-6 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C07963]">OmniKuno – Misiunea ta de azi</p>
      <h1 className="text-2xl font-bold text-[#2C2C2C]">
        {title} <span className="text-xl text-[#C07963]">· {focusLabel}</span>
      </h1>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 text-sm text-[#4D3F36]">
          <p className="font-semibold text-[#2C2C2C]">
            {focusLabel} <span className="text-[#B08A78]">· {moduleLevelLabel}</span>
          </p>
          <p className="text-[#7B6B60]">{progressSummary}</p>
        </div>
        {overviewLabel && onOpenOverview ? (
          <button
            type="button"
            onClick={onOpenOverview}
            className="rounded-full border border-[#E4DAD1] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] transition hover:border-[#C07963] hover:text-[#C07963]"
            data-testid="omnikuno-overview-button"
          >
            {overviewLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[12px] text-[#7B6B60]">
        <span>{adaptiveCopy}</span>
        <InfoTooltip label={adaptiveLabel} items={[adaptiveTooltip]} />
      </div>
      {adaptiveMessage ? (
        <div className="mt-3 flex items-start justify-between rounded-xl border border-[#F0E8E0] bg-[#FFFBF7] px-3 py-2 text-[12px] text-[#5A4B43]">
          <span className="leading-relaxed">{adaptiveMessage}</span>
          <button
            type="button"
            className="ml-2 text-[#B08A78] transition hover:text-[#2C2C2C]"
            onClick={onDismissAdaptive}
            aria-label="Închide mesajul"
          >
            ×
          </button>
        </div>
      ) : null}
    </header>
  );
}
