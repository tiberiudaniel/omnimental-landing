"use client";

import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import { useI18n } from "../../components/I18nProvider";
import { useNavigationLinks } from "../../components/useNavigationLinks";
import { useState } from "react";

export default function ContactPage() {
  const { lang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();
  const isRo = lang === "ro";
  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-4xl px-6 pt-12 text-sm leading-relaxed text-[#2C2C2C]">
        <h1 className="mb-3 text-2xl font-semibold text-[#1F1F1F]">{isRo ? "Contact" : "Contact"}</h1>
        <p className="mb-2">
          {isRo
            ? "Pentru întrebări sau propuneri, ne poți scrie pe email."
            : "For questions or proposals, you can reach us by email."}
        </p>
        <p className="mb-6">
          <a href="mailto:hello@omnimental.ro" className="font-semibold text-[#2C2C2C] underline decoration-[#C07963] underline-offset-2">hello@omnimental.ro</a>
        </p>
        <p className="opacity-70">
          {isRo
            ? "Vom reveni cu informații privind programările și suportul în curând."
            : "We will share details regarding scheduling and support soon."}
        </p>
      </main>
    </div>
  );
}

