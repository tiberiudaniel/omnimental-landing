"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/components/I18nProvider";
import { useState } from "react";
import { recordCtaClicked, recordExitModalShown } from "@/lib/progressFacts";

function ChooseContent() {
  const { lang } = useI18n();
  const router = useRouter();
  const search = useSearchParams();
  const isRO = lang !== "en";
  const [exitOpen, setExitOpen] = useState(false);
  return (
    <AppShell header={<SiteHeader wizardMode />}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {(() => {
          const from = search?.get("from");
          if (!from) return null;
          const isRO = lang !== "en";
          const text =
            from === "reco"
              ? isRO
                ? "Recomandare disponibilă. Alege modul de lucru pentru a o vedea complet."
                : "Recommendation available. Choose your format to view it fully."
              : from === "lite"
              ? isRO
                ? "Previzualizarea OmniScop Lite este gata. Alege modul pentru a debloca recomandarea completă."
                : "Your OmniScop Lite preview is ready. Choose a format to unlock the full recommendation."
              : from === "quick"
              ? isRO
                ? "Ai finalizat micro‑testele. Alege modul pentru a vedea recomandarea completă."
                : "You completed the micro‑tests. Choose a format to see the full recommendation."
              : null;
          return text ? (
            <div className="mb-3 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)]">
              {text}
            </div>
          ) : null;
        })()}
        <section className="space-y-4 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
          <h1 className="text-xl font-semibold text-[var(--omni-ink)]">
            {isRO ? "Încă nu ai ales modul de lucru" : "You haven’t chosen a format yet"}
          </h1>
          <p className="text-sm text-[var(--omni-ink-soft)]">
            {isRO ? "Poți testa acum și decide mai târziu." : "You can try now and decide later."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                void recordCtaClicked("omniscop_lite");
                router.push("/omniscop-lite");
              }}
              className="rounded-[12px] border border-[var(--omni-border-soft)] px-4 py-3 text-left text-sm text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
            >
              {isRO ? "Testează OmniScop (Lite)" : "Try OmniScop (Lite)"}
              <p className="mt-1 text-[12px] opacity-80">{isRO ? "2 pași esențiali, fără cont." : "2 essential steps, no account."}</p>
            </button>
            <button
              type="button"
              onClick={() => {
                void recordCtaClicked("omnicuno_quick");
                router.push("/omnicuno/quick-start");
              }}
              className="rounded-[12px] border border-[var(--omni-border-soft)] px-4 py-3 text-left text-sm text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
            >
              {isRO ? "Fă 2 micro‑teste OmniCuno" : "Do 2 OmniCuno micro‑tests"}
              <p className="mt-1 text-[12px] opacity-80">{isRO ? "Scor rapid + mici indicii." : "Quick scores + hints."}</p>
            </button>
            <button
              type="button"
              onClick={() => {
                void recordCtaClicked("book_intro");
                router.push("/progress?demo=1");
              }}
              className="rounded-[12px] border border-[var(--omni-border-soft)] px-4 py-3 text-left text-sm text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
            >
              {isRO ? "Programează o discuție de 15 min" : "Book a 15‑min intro call"}
              <p className="mt-1 text-[12px] opacity-80">{isRO ? "Îți păstrăm sesiunea în așteptare." : "We’ll keep a session on hold."}</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setExitOpen(true);
                void recordExitModalShown("/choose");
              }}
              className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-left text-sm text-[var(--omni-ink-soft)] hover:border-[var(--omni-energy)]"
            >
              {isRO ? "Renunță acum" : "Quit for now"}
              <p className="mt-1 text-[12px] opacity-80">{isRO ? "Îți păstrăm progresul 7 zile." : "We’ll keep your draft for 7 days."}</p>
            </button>
          </div>
          <p className="text-[11px] text-[var(--omni-muted)]">
            {isRO ? "Jurnalul personal se activează după alegere." : "Journal unlocks after you choose a format."}
          </p>
        </section>
      </div>

      <div className={`fixed inset-0 z-50 ${exitOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!exitOpen}>
        <div
          className={`absolute inset-0 bg-black/25 transition-opacity ${exitOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setExitOpen(false)}
        />
        <div className={`absolute left-1/2 top-1/2 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 transform rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)] ${exitOpen ? "opacity-100" : "opacity-0"}`}>
          <h2 className="mb-2 text-xl font-semibold text-[var(--omni-ink)]">
            {isRO ? "Încă nu ai ales modul de lucru" : "You haven’t chosen a format yet"}
          </h2>
          <p className="mb-4 text-sm text-[var(--omni-ink-soft)]">
            {isRO ? "Poți testa acum și decide mai târziu." : "You can try now and decide later."}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                void recordCtaClicked("omniscop_lite");
                router.push("/omniscop-lite");
              }}
              className="rounded-[12px] border border-[var(--omni-border-soft)] px-3 py-2 text-left text-sm text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
            >
              {isRO ? "Testează OmniScop (Lite)" : "Try OmniScop (Lite)"}
              <p className="mt-1 text-[11px] opacity-80">{isRO ? "2 pași esențiali, fără cont." : "2 essential steps, no account."}</p>
            </button>
            <button
              type="button"
              onClick={() => {
                void recordCtaClicked("omnicuno_quick");
                router.push("/omnicuno/quick-start");
              }}
              className="rounded-[12px] border border-[var(--omni-border-soft)] px-3 py-2 text-left text-sm text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
            >
              {isRO ? "Fă 2 micro‑teste OmniCuno" : "Do 2 OmniCuno micro‑tests"}
              <p className="mt-1 text-[11px] opacity-80">{isRO ? "Scoruri sintetice + hint." : "Synthetic scores + hints."}</p>
            </button>
            <button
              type="button"
              onClick={() => {
                void recordCtaClicked("book_intro");
                router.push("/progress?demo=1");
              }}
              className="rounded-[12px] border border-[var(--omni-border-soft)] px-3 py-2 text-left text-sm text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
            >
              {isRO ? "Programează o discuție de 15 min" : "Book a 15‑min intro call"}
              <p className="mt-1 text-[11px] opacity-80">{isRO ? "Păstrăm sesiunea în așteptare." : "We’ll keep a session on hold."}</p>
            </button>
            <button
              type="button"
              onClick={() => {
                void recordCtaClicked("quit");
                router.push("/");
              }}
              className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-2 text-left text-sm text-[var(--omni-ink-soft)] hover:border-[var(--omni-energy)]"
            >
              {isRO ? "Renunță" : "Quit"}
              <p className="mt-1 text-[11px] opacity-80">{isRO ? "Îți păstrăm progresul 7 zile." : "We’ll keep your draft for 7 days."}</p>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function ChoosePage() {
  return (
    <Suspense fallback={null}>
      <ChooseContent />
    </Suspense>
  );
}
