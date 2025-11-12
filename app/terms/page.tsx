"use client";

import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import { useI18n } from "../../components/I18nProvider";
import { useNavigationLinks } from "../../components/useNavigationLinks";
import { useState } from "react";

export default function TermsPage() {
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
          {isRo ? "Termeni și condiții" : "Terms of Service"}
        </h1>
        <p className="mb-2">
          {isRo
            ? "Aceste condiții stabilesc regulile de folosire a serviciilor OmniMental."
            : "These terms govern the use of OmniMental services."}
        </p>
        <ul className="mb-4 list-disc pl-6">
          <li>
            {isRo
              ? "Serviciile oferite sunt de coaching și educație, nu înlocuiesc evaluarea sau tratamentul medical."
              : "Services provided are for coaching and education; they do not replace medical diagnosis or treatment."}
          </li>
          <li>
            {isRo
              ? "Utilizatorii sunt responsabili de acuratețea informațiilor oferite."
              : "Users are responsible for the accuracy of the information they provide."}
          </li>
          <li>
            {isRo
              ? "Ne rezervăm dreptul de a actualiza acești termeni."
              : "We reserve the right to update these terms."}
          </li>
        </ul>
        <p className="opacity-70">
          {isRo
            ? "Versiune provizorie. Conținutul final va fi validat juridic."
            : "Provisional version. Final content will be legally validated."}
        </p>
      </main>
    </div>
  );
}

