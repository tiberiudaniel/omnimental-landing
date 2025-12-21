"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { startPremiumMock } from "@/lib/subscription";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useCopy } from "@/lib/useCopy";
import { getScreenIdForRoute } from "@/lib/routeIds";

const UPGRADE_SCREEN_ID = getScreenIdForRoute("/upgrade");

export default function UpgradePage() {
  const { user } = useAuth();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!user) {
      setMessage("Autentifică-te pentru a activa Premium.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await startPremiumMock(user.uid);
      setMessage("Contul tău a fost trecut pe Premium (mock). Reîncarcă Today pentru acces.");
    } catch (error) {
      console.warn("startPremiumMock failed", error);
      setMessage("Nu am reușit să activăm Premium.");
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => {}} />
  );

  const defaultTitle = "OmniMental Premium";
  const defaultSubtitle =
    "Acces nelimitat la sesiuni zilnice, arene, sesiuni intensive și orchestrare completă Omni-SensAI.";
  const defaultPrimaryCta = "Activează Premium (mock)";
  const defaultSecondaryCta = "Înapoi la Today";
  const heroCopy = useCopy(UPGRADE_SCREEN_ID, "ro", {
    h1: defaultTitle,
    subtitle: defaultSubtitle,
    ctaPrimary: defaultPrimaryCta,
    ctaSecondary: defaultSecondaryCta,
  });
  const heroTitle = heroCopy.h1 ?? defaultTitle;
  const heroSubtitle = heroCopy.subtitle ?? defaultSubtitle;
  const primaryCtaLabel = heroCopy.ctaPrimary ?? defaultPrimaryCta;
  const secondaryCtaLabel = heroCopy.ctaSecondary ?? defaultSecondaryCta;

  return (
    <>
      <AppShell header={header}>
        <div className="mx-auto max-w-3xl px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold">{heroTitle}</h1>
          <p className="mt-2 text-sm text-[var(--omni-ink)]/80">{heroSubtitle}</p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>• Sesiuni zilnice nelimitate</li>
            <li>• Sesiuni intensive ghidate (30–45 min)</li>
            <li>• Acces complet la Arene & Temples</li>
            <li>• Analize Omni-SensAI avansate</li>
          </ul>
          {message ? <p className="mt-4 text-sm text-[var(--omni-ink)]">{message}</p> : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <OmniCtaButton onClick={handleUpgrade} disabled={saving} className="justify-center sm:min-w-[220px]">
              {primaryCtaLabel}
            </OmniCtaButton>
            <OmniCtaButton as="link" href="/today" variant="neutral" className="justify-center">
              {secondaryCtaLabel}
            </OmniCtaButton>
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}
