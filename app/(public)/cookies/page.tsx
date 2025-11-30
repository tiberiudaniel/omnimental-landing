"use client";

import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useI18n } from "@/components/I18nProvider";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useState } from "react";

export default function CookiesPage() {
  const { lang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();
  const isRo = lang === "ro";
  return (
    <div className="bg-[var(--omni-bg-main)] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-4xl px-6 pt-12 text-sm leading-relaxed text-[var(--omni-ink)]">
        <h1 className="mb-3 text-2xl font-semibold text-[var(--omni-ink)]">
          {isRo ? "Politica cookies" : "Cookie Policy"}
        </h1>
        <p className="mb-2">
          {isRo
            ? "Folosim cookie-uri esențiale pentru funcționarea aplicației și analitice pentru îmbunătățirea experienței."
            : "We use essential cookies for app functionality and analytics to improve your experience."}
        </p>
        <ul className="mb-4 list-disc pl-6">
          <li>{isRo ? "Poți controla cookie-urile din setările browserului." : "You can control cookies from your browser settings."}</li>
          <li>
            {isRo
              ? "Nu folosim cookie-uri pentru a vinde sau partaja date personale."
              : "We do not use cookies to sell or share personal data."}
          </li>
        </ul>
        <p className="opacity-70">
          {isRo
            ? "Versiune provizorie. Politica finală va detalia tipurile de cookie-uri folosite."
            : "Provisional version. The final policy will detail cookie types in use."}
        </p>
      </main>
    </div>
  );
}

