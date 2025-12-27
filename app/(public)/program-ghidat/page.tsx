"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import SiteFooter from "@/components/SiteFooter";

const HIGHLIGHTS = [
  {
    title: "4 trăsături fundamentale",
    description: "Claritate, focus, energie funcțională și adaptabilitate emoțională, antrenate în același program.",
  },
  {
    title: "Sesiuni scurte, practice",
    description: "Micro-exerciții de 6–10 minute pe zi, cu transfer imediat în deciziile reale.",
  },
  {
    title: "Ghidare + feedback",
    description: "Context CAT-Lite, mini-task cognitiv și WOW session pentru prima victorie în 15 minute.",
  },
];

export default function ProgramGhidatPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();

  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] text-[var(--omni-ink)]">
      <SiteHeader
        showMenu
        onMenuToggle={() => setMenuOpen(true)}
        onAuthRequest={() => router.push("/auth?returnTo=%2Fintro")}
      />
      <main className="px-6 py-16 sm:px-10 lg:px-16">
        <section className="mx-auto flex max-w-6xl flex-col gap-10 rounded-[32px] border border-[var(--omni-border-soft)] bg-[color-mix(in_srgb,var(--omni-bg-paper)_85%,transparent)] px-6 py-12 shadow-[0_30px_120px_rgba(8,8,12,0.25)] md:flex-row md:items-center md:px-12 md:py-16">
          <div className="flex-1 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--omni-muted)]">
              Program ghidat OmniMental
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              OmniMental – antrenament pentru claritate, focus și adaptabilitate sub presiune.
            </h1>
            <p className="text-lg text-[color-mix(in_srgb,var(--omni-ink)_75%,white_25%)] sm:text-xl">
              4 trăsături măsurate, sesiuni scurte și exerciții practice care stabilizează deciziile zilnice. Intră în
              traseul ghidat, fără obiective vagi și fără teorii interminabile.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => router.push("/intro")}
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--omni-energy)] px-6 py-3 text-base font-semibold uppercase tracking-[0.35em] text-black transition hover:translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--omni-energy)_90%,white_10%)] sm:w-auto"
              >
                Pornește cinematicul
              </button>
              <p className="text-sm text-[var(--omni-muted)] sm:ml-2">Imersie de 90 secunde → onboarding ghidat</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-white/15 bg-white/3 p-6 backdrop-blur-lg">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/15 bg-white/4 p-4 shadow-[0_20px_60px_rgba(5,8,12,0.3)]">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">{item.title}</p>
                <p className="mt-2 text-base text-white/90">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 grid max-w-5xl gap-8 rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)]/70 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.25)] md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Traseu unic</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">Cum începi</h2>
            <ul className="mt-6 space-y-4 text-[var(--omni-ink)]/90">
              <li>
                <span className="font-semibold text-[var(--omni-energy)]">1.</span> Cinematic intro → gates &amp; Cat-Lite pentru o estimare rapidă pe cele 4 trăsături.
              </li>
              <li>
                <span className="font-semibold text-[var(--omni-energy)]">2.</span> QuickStroop task cu 10 trial-uri reale pentru control executiv.
              </li>
              <li>
                <span className="font-semibold text-[var(--omni-energy)]">3.</span> WOW session scurtă + templu personalizat → redirect auto la /today.
              </li>
            </ul>
          </div>
          <div className="rounded-[20px] border border-dashed border-[var(--omni-border-soft)] bg-white/70 p-6 text-[var(--omni-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Ce deblochezi</p>
            <ul className="mt-3 space-y-3 text-base">
              <li>• /today – plan zilnic ghidat (autonomie + feedback).</li>
              <li>• OmniKuno &amp; Buddy se activează automat când ai suficientă execuție reală.</li>
              <li>• Wizard (desert) devine disponibil după ~31 sesiuni reale.</li>
            </ul>
            <p className="mt-6 text-sm text-[var(--omni-muted)]">Fără alegeri paralele pentru userii noi – doar traseul principal.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </div>
  );
}
