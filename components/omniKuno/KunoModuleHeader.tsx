"use client";

import { useI18n } from "@/components/I18nProvider";
import InfoTooltip from "@/components/InfoTooltip";

export function KunoModuleHeader({
  title,
  focusLabel,
  progressLabel,
  xpLabel,
  adaptiveMessage,
  onDismissAdaptive,
}: {
  title: string;
  focusLabel: string;
  progressLabel: string;
  xpLabel: string;
  adaptiveMessage: string | null;
  onDismissAdaptive: () => void;
}) {
  const { t } = useI18n();
  return (
    <header className="rounded-2xl border border-[#E4DAD1] bg-white px-6 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C07963]">OmniKuno</p>
      <h1 className="text-2xl font-bold text-[#2C2C2C]">
        {title} · <span className="text-xl text-[#C07963]">{focusLabel}</span>
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#7B6B60]">
        <span>{focusLabel} · Nivel 1</span>
        <span>{progressLabel}</span>
        <span>{xpLabel}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[#7B6B60]">
        <span>{String(t("omnikuno.adaptive.headerExplainerShort"))}</span>
        <InfoTooltip label={String(t("omnikuno.adaptive.headerExplainer"))} items={[String(t("omnikuno.adaptive.tooltip"))]} />
      </div>
      {adaptiveMessage ? (
        <div className="mt-3 flex items-start justify-between rounded-xl border border-[#F0E8E0] bg-[#FFFBF7] px-3 py-2 text-[12px] text-[#5A4B43]">
          <span>{adaptiveMessage}</span>
          <button type="button" className="ml-2 text-[#B08A78] transition hover:text-[#2C2C2C]" onClick={onDismissAdaptive}>
            ×
          </button>
        </div>
      ) : null}
    </header>
  );
}
