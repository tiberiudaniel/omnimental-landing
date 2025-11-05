"use client";

import { useMemo, useState } from "react";
import ClientI18nWrapper from "../../components/ClientI18nWrapper";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import EvaluationForm from "../../components/EvaluationForm";

function EvaluationContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useMemo(
    () => [
      { label: "Program", href: "/group-info", description: "Detalii Mental Coaching Group" },
      { label: "Evaluare", href: "/evaluation", description: "Completează scala de progres" },
      { label: "Despre mine", href: "/about", description: "Cine sunt și cum lucrez" },
      { label: "Contact", href: "mailto:hello@omnimental.ro", description: "Scrie-mi direct" },
    ],
    []
  );

  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <div className="mx-auto max-w-4xl px-6 pt-12">
        <EvaluationForm />
      </div>
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <ClientI18nWrapper>
      <EvaluationContent />
    </ClientI18nWrapper>
  );
}
