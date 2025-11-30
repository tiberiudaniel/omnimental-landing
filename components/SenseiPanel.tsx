"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";

export default function SenseiPanel({ userId }: { userId: string }) {
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate");
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const title = ((): string => {
    const v = t("senseiTitle");
    return typeof v === "string" ? (v as string) : "Omni Sensei";
  })();
  const subtitle = ((): string => {
    const v = t("senseiSubtitle");
    return typeof v === "string"
      ? (v as string)
      : (lang === "ro"
          ? "Generează o provocare personalizată (quest) pe baza stilului și a intrărilor recente."
          : "Generate a personalized quest based on your style and recent inputs.");
  })();
  const btnLabel = loading
    ? (typeof t("senseiGenerating") === "string" ? (t("senseiGenerating") as string) : (lang === "ro" ? "Se generează…" : "Generating…"))
    : (typeof t("senseiOpen") === "string" ? (t("senseiOpen") as string) : (lang === "ro" ? "Deschide Sensei" : "Open Sensei"));
  const miniTitle = typeof t("senseiMiniQuizTitle") === "string" ? (t("senseiMiniQuizTitle") as string) : "Mini‑quiz (placeholder)";
  const miniBody = typeof t("senseiMiniQuizBody") === "string"
    ? (t("senseiMiniQuizBody") as string)
    : (lang === "ro" ? "În versiunea următoare: 2–3 întrebări rapide pentru personalizare fină." : "Coming next: 2–3 quick questions for fine-tuning.");

  return (
    <section className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-[var(--omni-ink)]">{title}</h2>
        <p className="text-sm text-[var(--omni-ink-soft)]">{subtitle}</p>
      </header>
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleGenerate()}
        className="rounded-[10px] border border-[var(--omni-border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)] disabled:opacity-60"
      >
        {btnLabel}
      </button>
      {error ? <p className="mt-3 text-xs text-[var(--omni-danger)]">{error}</p> : null}
      {result ? (
        <pre className="mt-3 max-h-64 overflow-auto rounded bg-[var(--omni-bg-paper)] p-3 text-xs text-[var(--omni-ink)]">{result}</pre>
      ) : null}
      <div className="mt-4 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-3 text-xs text-[var(--omni-ink)]">
        <p className="mb-1 font-semibold">{miniTitle}</p>
        <p>{miniBody}</p>
      </div>
    </section>
  );
}
