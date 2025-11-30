"use client";

import SiteHeader from "@/components/SiteHeader";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";

export default function QuickStartPage() {
  const { lang } = useI18n();
  const isRO = lang !== "en";
  return (
    <AppShell header={<SiteHeader wizardMode />}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <section className="space-y-4 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
          <h1 className="text-xl font-semibold text-[var(--omni-ink)]">{isRO ? "OmniCuno – Quick start" : "OmniCuno – Quick start"}</h1>
          <p className="text-sm text-[var(--omni-ink-soft)]">
            {isRO
              ? "Două micro‑teste demo (scoruri sintetice). Deblochezi recomandarea completă după alegere."
              : "Two demo micro‑tests (synthetic scores). Unlock full recommendation after choosing."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-4">
              <p className="text-sm font-semibold text-[var(--omni-ink)]">{isRO ? "Calm rapid" : "Quick calm"}</p>
              <p className="text-[12px] text-[var(--omni-ink-soft)]">{isRO ? "5 itemi – 30 secunde" : "5 items – 30 seconds"}</p>
            </div>
            <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-4">
              <p className="text-sm font-semibold text-[var(--omni-ink)]">{isRO ? "Claritate & focus" : "Clarity & focus"}</p>
              <p className="text-[12px] text-[var(--omni-ink-soft)]">{isRO ? "5 itemi – 30 secunde" : "5 items – 30 seconds"}</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

