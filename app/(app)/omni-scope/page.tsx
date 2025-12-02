"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";
import OmniIntentForm from "@/components/OmniIntentForm";
import { JournalDrawer } from "@/components/journal/JournalDrawer";
import { JournalPanel } from "@/components/journal/JournalPanel";
import type { JournalContext } from "@/components/journal/useJournal";
import { useWindowWidth } from "@/lib/useWindowSize";

export default function OmniScopePage() {
  const { profile } = useProfile();
  const { lang } = useI18n();
  const navLinks = useNavigationLinks();
  const width = useWindowWidth();
  const isMobile = width !== 0 && width < 1024;

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedJournalContext, setSelectedJournalContext] = useState<JournalContext | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [showJournalPanel, setShowJournalPanel] = useState(true);

  const handleOpenJournal = (ctx: JournalContext | null) => {
    setSelectedJournalContext(ctx);
    const shouldOpenDrawer = (() => {
      if (typeof window === "undefined") return isMobile;
      if (width && width > 0) return width < 1024;
      return window.matchMedia && window.matchMedia("(max-width: 1023px)").matches;
    })();
    if (shouldOpenDrawer) {
      setJournalOpen(true);
    } else {
      setJournalOpen(false);
      setShowJournalPanel(true);
      if (typeof window !== "undefined") {
        setTimeout(() => {
          const el = document.getElementById("journal-panel-wrapper");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
      }
    }
  };

  const defaultDesktopContext: JournalContext | null =
    !isMobile
      ? {
          theme: lang === "ro" ? "Claritate & cunoaștere" : "Clarity & knowledge",
          sourcePage: "scop_intentii",
          sourceBlock: "section_knowledge",
          suggestedSnippets: [],
        }
      : null;

  return (
    <>
      <AppShell
        header={<SiteHeader onMenuToggle={() => setMenuOpen(true)} showMenu />}
      >
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/95 px-4 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)] lg:px-6 lg:py-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
              <div>
                <OmniIntentForm
                  lang={lang === "en" ? "en" : "ro"}
                  onOpenJournal={handleOpenJournal}
                  activeJournalSourceBlock={
                    (selectedJournalContext ?? defaultDesktopContext)?.sourceBlock
                  }
                />
              </div>
              <div className="relative hidden lg:block">
                <div
                  id="journal-panel-wrapper"
                  className="sticky top-20 max-h-[calc(100vh-7rem)] overflow-auto"
                >
                  {showJournalPanel ? (
                    <JournalPanel
                      userId={profile?.id}
                      context={selectedJournalContext ?? defaultDesktopContext}
                      onClose={() => setShowJournalPanel(false)}
                    />
                  ) : (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="omni-btn-ghost text-[11px] font-semibold uppercase tracking-[0.2em]"
                        onClick={() => setShowJournalPanel(true)}
                      >
                        {lang === "ro" ? "Arată jurnalul" : "Show journal"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <JournalDrawer
              open={journalOpen && isMobile}
              onOpenChange={setJournalOpen}
              userId={profile?.id ?? null}
              context={selectedJournalContext ?? undefined}
            />
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}
