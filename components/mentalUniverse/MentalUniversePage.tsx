"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useI18n } from "@/components/I18nProvider";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";

type UniverseArea = {
  id: string;
  moduleId: OmniKunoModuleId;
  icon: string;
  title: { ro: string; en: string };
  description: { ro: string; en: string };
};

const UNIVERSE_AREAS: UniverseArea[] = [
  {
    id: "mental-clarity",
    moduleId: "decision_discernment",
    icon: "🧭",
    title: {
      ro: "Claritate mentală",
      en: "Mental clarity",
    },
    description: {
      ro: "Construiește ritualul de decizie calmă și definește ce contează în sezonul tău mental.",
      en: "Build the calm decision ritual and define what matters in your current mental season.",
    },
  },
  {
    id: "energy-sleep",
    moduleId: "energy_body",
    icon: "⚡",
    title: {
      ro: "Energie & Somn",
      en: "Energy & sleep",
    },
    description: {
      ro: "Optimizează micro-ritualurile de respirație și protecție a somnului ca să refaci resursele mai rapid.",
      en: "Optimize breathing micro-rituals and sleep protection to rebuild energy faster.",
    },
  },
  {
    id: "emotions-resilience",
    moduleId: "emotional_balance",
    icon: "💠",
    title: {
      ro: "Emoții & Reziliență",
      en: "Emotions & resilience",
    },
    description: {
      ro: "Devino mai stabil în haos cu protocoale scurte: body scan, micro-breaks și reset de seară.",
      en: "Stay steady in chaos with short protocols: body scan, micro-breaks, and evening resets.",
    },
  },
  {
    id: "focus-distractions",
    moduleId: "focus_clarity",
    icon: "🎯",
    title: {
      ro: "Focus & Distrageri",
      en: "Focus & distractions",
    },
    description: {
      ro: "Antrenează-ți atenția în sprinturi scurte și folosește checkpoint-uri zilnice pentru a evita zgomotul.",
      en: "Train your attention in short sprints and use daily checkpoints to keep the noise away.",
    },
  },
  {
    id: "willpower-perseverance",
    moduleId: "willpower_perseverance",
    icon: "🛡️",
    title: {
      ro: "Voință & Perseverență",
      en: "Willpower & perseverance",
    },
    description: {
      ro: "Activează disciplina calmă prin pași de 90 secunde și protejează energia când presiunea crește.",
      en: "Activate calm discipline with 90-second steps and protect your energy when the pressure spikes.",
    },
  },
  {
    id: "optimal-weight",
    moduleId: "optimal_weight_management",
    icon: "🥗",
    title: {
      ro: "Greutate optimă",
      en: "Optimal weight",
    },
    description: {
      ro: "Îți reglezi alimentația, energia și relația cu mâncarea fără extreme sau diete imposibile.",
      en: "Align nutrition, energy and your relationship with food without extremes or impossible diets.",
    },
  },
];

export default function MentalUniversePage() {
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useI18n();

  const introTitle = lang === "ro" ? "Mental Universe Map" : "Mental Universe Map";
  const introLead =
    lang === "ro"
      ? "Fiecare zonă concentrează lecțiile OmniKuno și misiunile OmniAbil într-un Arc mental clar. Alege zona care îți servește provocarea actuală și sari direct în lecțiile potrivite."
      : "Each area blends OmniKuno lessons with OmniAbil missions into a clear mental arc. Pick the area that matches today’s challenge and jump straight into the right lessons.";

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2C2C]">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="rounded-3xl border border-[#E4DAD1] bg-white/95 p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#B08A78]">
            {lang === "ro" ? "Harta sezonului mental" : "Your mental season map"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#2C2C2C] sm:text-4xl">{introTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5A4334] sm:text-base">{introLead}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-[#7B6B60]">
            <div className="rounded-full border border-[#DECFC0] bg-[#FFF5EB] px-3 py-1">
              {lang === "ro" ? "Season 1 — Claritate & Energie" : "Season 1 — Clarity & Energy"}
            </div>
            <div className="rounded-full border border-[#DECFC0] px-3 py-1">
              {lang === "ro" ? "Arc activ" : "Active arc"}
            </div>
          </div>
        </section>
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {UNIVERSE_AREAS.map((area) => (
            <article
              key={area.id}
              className="flex h-full flex-col justify-between rounded-3xl border border-[#E6DAD0] bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="text-3xl">{area.icon}</div>
                <h2 className="mt-3 text-xl font-semibold text-[#2D2017]">
                  {area.title[lang as "ro" | "en"] ?? area.title.ro}
                </h2>
                <p className="mt-2 text-sm text-[#5A4334]">
                  {area.description[lang as "ro" | "en"] ?? area.description.ro}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-[12px] text-[#7B6B60]">
                <span>{lang === "ro" ? "Arc recomandat" : "Suggested arc"}</span>
                <Link
                  href={`/omni-kuno?area=${area.moduleId}`}
                  className="inline-flex items-center rounded-full border border-[#C5B29E] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5A3E2B] transition hover:border-[#8B5A3A]"
                >
                  {lang === "ro" ? "Vezi lecțiile" : "View lessons"}
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
