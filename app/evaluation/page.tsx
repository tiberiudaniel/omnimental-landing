"use client";

import { useState } from "react";
import ClientI18nWrapper from "../../components/ClientI18nWrapper";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import EvaluationForm from "../../components/EvaluationForm";
import { useNavigationLinks } from "../../components/useNavigationLinks";

function EvaluationContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();

  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <div className="mx-auto max-w-4xl px-6 pt-12">
        <div className="panel-canvas panel-canvas--hero panel-canvas--brain-right rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-10 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[1.5px]">
          <EvaluationForm />
        </div>
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
