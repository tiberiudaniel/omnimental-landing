"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useI18n } from "@/components/I18nProvider";

export default function OmniFlexPage() {
  const { lang } = useI18n();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <AppShell header={<SiteHeader onMenuToggle={() => setMenuOpen(true)} showMenu />}>
        <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-3xl font-semibold text-[var(--omni-ink)]">
            {lang === "ro" ? "Omni-Flex" : "Omni-Flex"}
          </h1>
          <p className="text-sm text-[var(--omni-ink-soft)]">
            {lang === "ro" ? "În curând." : "Coming soon."}
          </p>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}
