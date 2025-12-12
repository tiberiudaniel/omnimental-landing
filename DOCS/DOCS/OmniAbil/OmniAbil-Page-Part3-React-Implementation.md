# OmniAbil – Implementare React

## 1. Pagina OmniAbil (client component)

Fișier: `components/omniAbil/OmniAbilPage.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";
import { OmniAbilCard } from "@/components/dashboard/OmniAbilCard";
import { getUserAbilitiesWithMoves } from "@/lib/omniAbilEngine";
import type { OmniAbilAbilityWithMoves } from "@/lib/omniAbilEngine";

function AbilityCard(props: { entry: OmniAbilAbilityWithMoves; lang: "ro" | "en" }) {
  const { entry, lang } = props;
  const { ability, moves } = entry;
  const t = (value: { ro: string; en: string }) => (lang === "en" ? value.en : value.ro);

  return (
    <article className="flex h-full flex-col rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/95 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl">{ability.icon}</div>
          <h3 className="mt-2 text-[15px] font-semibold text-[var(--omni-ink)]">
            {t(ability.title)}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--omni-muted)]">
            {t(ability.oneLiner)}
          </p>
        </div>
      </header>
      <div className="mt-3 flex flex-1 flex-col gap-2">
        {moves.slice(0, 4).map((move) => (
          <div
            key={move.id}
            className="rounded-2xl border border-[#E6D6C5] bg-[#FFF7EF] px-3 py-2"
          >
            <p className="text-[12px] font-semibold text-[var(--omni-ink)]">
              {t(move.title)}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-[var(--omni-muted)]">
              {t(move.description)}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">
              {move.durationSeconds
                ? `~${Math.round(move.durationSeconds / 60)} min · +${move.xpReward} XP`
                : `+${move.xpReward} XP`}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function OmniAbilPage() {
  const router = useRouter();
  const navLinks = useNavigationLinks();
  const { profile } = useProfile();
  const { lang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";
  const abilitiesWithMoves = getUserAbilitiesWithMoves();

  const header = (
    <SiteHeader
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Fomni-abil")}
    />
  );

  const title =
    normalizedLang === "ro"
      ? "OmniAbil · Implementare practică"
      : "OmniAbil · Practical implementation";

  const subtitle =
    normalizedLang === "ro"
      ? "Aici transformi ce ai învățat în acțiuni scurte, repetate, care schimbă cum trăiești ziua."
      : "Here you turn what you’ve learned into short, repeatable actions that change how you live your day.";

  return (
    <>
      <MenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={navLinks}
        profile={profile}
      />
      <AppShell header={header}>
        <section className="omni-card rounded-3xl bg-[var(--omni-surface-card)]/95 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.06)] md:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            {normalizedLang === "ro" ? "Nivelul 2 · Acțiune" : "Level 2 · Action"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">{title}</h1>
          <p className="mt-3 text-sm text-[var(--omni-ink-soft)] sm:text-base">
            {subtitle}
          </p>
          <p className="mt-2 text-[11px] text-[var(--omni-muted)] sm:text-[12px]">
            {normalizedLang === "ro"
              ? "Nu adăugăm zgomot, ci pași simpli. OmniKuno clarifică ce contează. OmniAbil te ajută să pui în practică, fără presiune, cu pași de 90 de secunde până la 10 minute."
              : "We don’t add noise, only simple steps. OmniKuno clarifies what matters. OmniAbil helps you apply it, without pressure, in 90-second to 10-minute steps."}
          </p>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="omni-card h-full rounded-3xl bg-[var(--omni-surface-card)]/95 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.06)] sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              {normalizedLang === "ro" ? "Misiunile tale de azi" : "Your missions for today"}
            </p>
            <p className="mt-1 text-[13px] text-[var(--omni-ink-soft)]">
              {normalizedLang === "ro"
                ? "Alege ce poți face realist azi. Bifezi, iar progresul tău se reflectă în timp, comparat doar cu tine."
                : "Choose what you can realistically do today. Check it off and see your progress over time, compared only to yourself."}
            </p>
            <div className="mt-4">
              <OmniAbilCard lang={normalizedLang} />
            </div>
          </div>

          <div className="omni-card h-full rounded-3xl bg-[var(--omni-surface-card)]/95 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.06)] sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              {normalizedLang === "ro" ? "Cum funcționează OmniAbil" : "How OmniAbil works"}
            </p>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[var(--omni-ink-soft)]">
              <li>
                {normalizedLang === "ro"
                  ? "1. OmniKuno îți oferă claritate și modele mentale."
                  : "1. OmniKuno gives you clarity and mental models."}
              </li>
              <li>
                {normalizedLang === "ro"
                  ? "2. OmniAbil le traduce în misiuni zilnice și săptămânale, în pași scurți și clari."
                  : "2. OmniAbil translates them into daily and weekly missions, in short clear steps."}
              </li>
              <li>
                {normalizedLang === "ro"
                  ? "3. Pe măsură ce aplici, XP-ul și mastery-ul tău cresc și moveset-ul devine mai fin."
                  : "3. As you apply, your XP and mastery grow and your moveset becomes more refined."}
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {normalizedLang === "ro"
                  ? "Abilități active & moveset"
                  : "Active abilities & moveset"}
              </p>
              <p className="mt-1 text-[13px] text-[var(--omni-ink-soft)]">
                {normalizedLang === "ro"
                  ? "Fiecare abilitate are 4 mișcări de bază: ritual zilnic, micro reset, booster și emergency move."
                  : "Each ability has 4 basic moves: daily ritual, micro reset, booster, and emergency move."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {abilitiesWithMoves.map((entry) => (
              <AbilityCard key={entry.ability.id} entry={entry} lang={normalizedLang} />
            ))}
          </div>
        </section>
      </AppShell>
    </>
  );
}


Route /omni-abil

Fișier: app/(app)/omni-abil/page.tsx

import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import OmniAbilPage from "@/components/omniAbil/OmniAbilPage";

function OmniAbilPageInner() {
  return (
    <RequireAuth redirectTo="/omni-abil">
      <OmniAbilPage />
    </RequireAuth>
  );
}

export default function OmniAbilRoute() {
  return (
    <Suspense fallback={null}>
      <OmniAbilPageInner />
    </Suspense>
  );
}

