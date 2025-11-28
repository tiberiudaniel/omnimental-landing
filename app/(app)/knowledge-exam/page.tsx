"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";
import OmniKnowledgeQuiz from "@/components/OmniKnowledgeQuiz";

export default function KnowledgeExamPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { lang, t } = useI18n();
  const normalizedLang = lang === "en" ? "en" : "ro";
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const goToAuth = () => router.push("/auth");
  const sectionLabel = useMemo(
    () => (lang === "ro" ? "OmniMental" : "OmniMental"),
    [lang],
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2C2C]">
      <SiteHeader compact onAuthRequest={!profile?.id ? goToAuth : undefined} onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <div className="rounded-2xl border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm md:px-8 md:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B08A78]">{sectionLabel}</p>
          <h1 className="mt-1 text-3xl font-bold text-[#2C2C2C]">{String(t("antrenament.oc.quizHeading"))}</h1>
          <p className="mt-2 text-sm text-[#5A4B43]">{String(t("antrenament.oc.quizDescription"))}</p>
          <div className="mt-6">
            <OmniKnowledgeQuiz lang={normalizedLang} />
          </div>
        </div>
      </main>
    </div>
  );
}
