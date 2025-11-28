"use client";

import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useI18n } from "@/components/I18nProvider";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useState } from "react";

export default function PrivacyPage() {
  const { lang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();
  const isRo = lang === "ro";
  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-4xl px-6 pt-12 text-sm leading-relaxed text-[#2C2C2C]">
        <h1 className="mb-3 text-2xl font-semibold text-[#1F1F1F]">
          {isRo ? "Politica de confidențialitate" : "Privacy Policy"}
        </h1>
        <p className="mb-2">
          {isRo
            ? "Respectăm confidențialitatea ta. Această pagină descrie pe scurt tipurile de date pe care le putem procesa în cadrul serviciilor OmniMental și modul în care le protejăm."
            : "We respect your privacy. This page briefly outlines what data we may process as part of OmniMental services and how we protect it."}
        </p>
        <ul className="mb-4 list-disc pl-6">
          <li>
            {isRo
              ? "Date minime de contact (ex. email) pentru acces și comunicări esențiale."
              : "Minimal contact data (e.g., email) for access and essential communications."}
          </li>
          <li>
            {isRo
              ? "Date non‑sensibile privind progresul (ex. selecții, scoruri agregate) pentru personalizare și feedback."
              : "Non‑sensitive progress data (e.g., selections, aggregated scores) for personalization and feedback."}
          </li>
          <li>
            {isRo
              ? "Nu vindem datele tale. Le folosim exclusiv pentru a îmbunătăți experiența."
              : "We do not sell your data. We use it solely to improve your experience."}
          </li>
        </ul>
        <p className="opacity-70">
          {isRo
            ? "Versiune provizorie. Textul final va fi actualizat conform legislației și practicilor curente."
            : "Provisional version. The final text will be updated to reflect current regulations and practices."}
        </p>
      </main>
    </div>
  );
}

