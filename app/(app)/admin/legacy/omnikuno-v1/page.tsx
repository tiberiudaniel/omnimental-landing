"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";
import OmniKnowledgeQuiz from "@/components/OmniKnowledgeQuiz";

export default function LegacyOmniKunoV1Page() {
  const router = useRouter();
  const { profile } = useProfile();
  const { lang, t } = useI18n();
  const normalizedLang = lang === "en" ? "en" : "ro";
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const goToAuth = () => router.push("/auth");
  const sectionLabel = useMemo(
    () => (lang === "ro" ? "OmniKuno v1 legacy" : "OmniKuno v1 legacy"),
    [lang],
  );

  return (
    <>
      <AppShell
        header={
          <SiteHeader
            onAuthRequest={!profile?.id ? goToAuth : undefined}
            onMenuToggle={() => setMenuOpen(true)}
          />
        }
        mainClassName="text-[var(--omni-ink)]"
      >
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <div className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-sm md:px-8 md:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
              {sectionLabel}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--omni-ink)]">
              {String(t("antrenament.oc.quizHeading"))}
            </h1>
            <p className="mt-2 text-sm text-[#5A4B43]">
              {String(t("antrenament.oc.quizDescription"))}
            </p>
            <div className="mt-6">
              <OmniKnowledgeQuiz lang={normalizedLang} />
            </div>
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

