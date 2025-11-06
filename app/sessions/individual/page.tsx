"use client";

import { useState } from "react";
import ClientI18nWrapper from "../../../components/ClientI18nWrapper";
import SessionDetails from "../../../components/SessionDetails";
import SocialProof from "../../../components/SocialProof";
import SiteHeader from "../../../components/SiteHeader";
import MenuOverlay from "../../../components/MenuOverlay";
import { useNavigationLinks } from "../../../components/useNavigationLinks";

function IndividualSessionsContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();

  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <main className="px-6 pt-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          <SessionDetails type="individual" />
          <SocialProof />
        </div>
      </main>
    </div>
  );
}

export default function IndividualSessionsPage() {
  return (
    <ClientI18nWrapper>
      <IndividualSessionsContent />
    </ClientI18nWrapper>
  );
}
