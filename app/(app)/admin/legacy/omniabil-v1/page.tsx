"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";
import OmniAbilitiesForm from "@/components/OmniAbilitiesForm";

export default function LegacyOmniAbilV1Page() {
  const router = useRouter();
  const { profile } = useProfile();
  const { lang } = useI18n();
  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const goToAuth = () => router.push("/auth");

  return (
    <>
      <AppShell
        header={
          <SiteHeader
            onAuthRequest={!profile?.id ? goToAuth : undefined}
            onMenuToggle={() => setMenuOpen(true)}
          />
        }
      >
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
          <div className="rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/95 px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)] md:px-8 md:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              {normalizedLang === "ro" ? "OmniAbil v1 legacy" : "OmniAbil v1 legacy"}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--omni-ink)]">
              {normalizedLang === "ro" ? "Evaluare Omni-Abilități" : "Omni-Abilities assessment"}
            </h1>
            <p className="mt-2 text-sm text-[var(--omni-ink-soft)]">
              {normalizedLang === "ro"
                ? "Instrumentul istoric pentru măsurarea progresului în OmniAbil. Folosit doar în context intern/admin."
                : "Historical instrument for measuring OmniAbil progress. Use internally/admin only."}
            </p>
            <div className="mt-6">
              <OmniAbilitiesForm lang={normalizedLang} />
            </div>
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

