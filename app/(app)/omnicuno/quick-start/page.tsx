"use client";

import SiteHeader from "@/components/SiteHeader";
import { useI18n } from "@/components/I18nProvider";

export default function QuickStartPage() {
  const { lang } = useI18n();
  const isRO = lang !== "en";
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader wizardMode compact />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
          <h1 className="text-xl font-semibold text-[#1F1F1F]">{isRO ? "OmniCuno – Quick start" : "OmniCuno – Quick start"}</h1>
          <p className="text-sm text-[#4A3A30]">
            {isRO
              ? "Două micro‑teste demo (scoruri sintetice). Deblochezi recomandarea completă după alegere."
              : "Two demo micro‑tests (synthetic scores). Unlock full recommendation after choosing."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] p-4">
              <p className="text-sm font-semibold text-[#2C2C2C]">{isRO ? "Calm rapid" : "Quick calm"}</p>
              <p className="text-[12px] text-[#5C4F45]">{isRO ? "5 itemi – 30 secunde" : "5 items – 30 seconds"}</p>
            </div>
            <div className="rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] p-4">
              <p className="text-sm font-semibold text-[#2C2C2C]">{isRO ? "Claritate & focus" : "Clarity & focus"}</p>
              <p className="text-[12px] text-[#5C4F45]">{isRO ? "5 itemi – 30 secunde" : "5 items – 30 seconds"}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

