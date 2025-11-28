"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
// I18nProvider is now in RootLayout; no page-level wrapper needed
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { EvaluationTrend } from "@/components/EvaluationTrend";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";
import { useTStrings } from "@/components/useTStrings";
import OmniAbilitiesForm from "@/components/OmniAbilitiesForm";
import OmniIntentForm from "@/components/OmniIntentForm";
import EvaluationWizard from "@/components/evaluation/EvaluationWizard";
import { recordEvaluationTabChange } from "@/lib/progressFacts";
import { useProgressFacts } from "@/components/useProgressFacts";
import QuestsList from "@/components/QuestsList";
import InfoTooltip from "@/components/InfoTooltip";
import WizardSondajCBT from "@/components/WizardSondajCBT";
import { JournalDrawer } from "@/components/journal/JournalDrawer";
import { JournalPanel } from "@/components/journal/JournalPanel";
import type { JournalContext } from "@/components/journal/useJournal";
import { useWindowWidth } from "@/lib/useWindowSize";

const TAB_ITEMS = [
  { key: "os", label: "Omni-Scop", description: "Scop & intenție", status: "live" },
  { key: "oc", label: "Omni-Kuno", description: "Cunoaștere & concepte", status: "live" },
  { key: "oa", label: "Omni-Abil", description: "Abilități practice", status: "live" },
  { key: "ose", label: "Omni-Flex", description: "Flexibilitate psihologică", status: "preview" },
  { key: "oi", label: "Omni-Intel", description: "Stare integrativă", status: "preview" },
] as const;

// Tab helper copy is now in i18n: antrenamentTabHelp.{os|oc|ose|oa|oi}

type TabKey = (typeof TAB_ITEMS)[number]["key"];
const DEFAULT_TAB: TabKey = "oc";
const PREVIEW_TABS = TAB_ITEMS.filter((tab) => tab.status === "preview").map((tab) => tab.key) as TabKey[];

function AntrenamentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();
  const { profile } = useProfile();
  const { lang, t } = useI18n();
  const { s } = useTStrings();
  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";
  const width = useWindowWidth();
  const isMobile = width !== 0 && width < 1024; // lg breakpoint ~1024
  const [selectedJournalContext, setSelectedJournalContext] = useState<JournalContext | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [showJournalPanel, setShowJournalPanel] = useState(true);

  // (moved below activeTab initialization)
  const allKeys = useMemo(() => TAB_ITEMS.map((t) => t.key), []);
  const activeTab = useMemo<TabKey>(() => {
    const q = searchParams?.get("tab");
    if (q && allKeys.includes(q as TabKey) && !PREVIEW_TABS.includes(q as TabKey)) {
      return q as TabKey;
    }
    return DEFAULT_TAB;
  }, [allKeys, searchParams]);
  const accessTier = profile?.accessTier ?? "member";
  const isMember = Boolean(profile?.id) || accessTier !== "public";
  const { data: progress } = useProgressFacts(profile?.id);
  const tabWhatItems = useMemo(() => {
    const value = t(`antrenamentTabWhat.${activeTab}`);
    return Array.isArray(value) ? (value as string[]) : [];
  }, [activeTab, t]);

  // Drawer renders only on mobile; no effect needed to close on desktop

  // Default journal context handled inline to avoid setState in effects.

  const renderTabContent = () => {
    switch (activeTab) {
      case "os":
        return isMember ? (
          <div className="rounded-[16px] border border-[#D8C6B6] bg-white/95 px-4 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)] lg:px-6 lg:py-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
              <div>
                <OmniIntentForm
                  lang={normalizedLang}
                  onOpenJournal={(ctx) => {
                    setSelectedJournalContext(ctx);
                    // Open the drawer only on mobile; on desktop use the right-side panel
                    const shouldOpen = (() => {
                      if (typeof window === "undefined") return isMobile;
                      if (width && width > 0) return width < 1024;
                      return window.matchMedia && window.matchMedia("(max-width: 1023px)").matches;
                    })();
                    if (shouldOpen) setJournalOpen(true);
                    else {
                      setJournalOpen(false);
                      setShowJournalPanel(true); // ensure panel is visible when user asks to open journal on desktop
                      // scroll the panel into view for immediate feedback
                      if (typeof window !== "undefined") {
                        setTimeout(() => {
                          const el = document.getElementById("journal-panel-wrapper");
                          el?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 0);
                      }
                    }
                  }}
                  activeJournalSourceBlock={(selectedJournalContext ?? (!isMobile && activeTab === "os"
                    ? {
                        theme: lang === "ro" ? "Claritate & cunoaștere" : "Clarity & knowledge",
                        sourcePage: "scop_intentii",
                        sourceBlock: "section_knowledge",
                        suggestedSnippets: [],
                      }
                    : null))?.sourceBlock}
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
                      context={selectedJournalContext ?? (activeTab === "os"
                        ? {
                            theme: lang === "ro" ? "Claritate & cunoaștere" : "Clarity & knowledge",
                            sourcePage: "scop_intentii",
                            sourceBlock: "section_knowledge",
                            suggestedSnippets: [],
                          }
                        : null)}
                      onClose={() => setShowJournalPanel(false)}
                    />
                  ) : (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="rounded-[10px] border border-[#E4D8C6] px-3 py-1 text-[11px] text-[#2C2C2C] hover:border-[#C9B8A8]"
                        onClick={() => setShowJournalPanel(true)}
                      >
                        {lang === "ro" ? "Arată jurnalul" : "Show journal"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Mobile journal drawer */}
            <JournalDrawer
              open={journalOpen && isMobile}
              onOpenChange={setJournalOpen}
              userId={profile?.id ?? null}
              context={selectedJournalContext ?? undefined}
            />
          </div>
        ) : (
          <LockedModuleCard
            title={lang === "ro" ? "Omni-Scop" : "Omni-Intent"}
            description={lang === "ro" ? "Disponibil doar membrilor programului." : "Available for members of the program."}
          />
        );
      case "oc":
        return (
          <div className="rounded-[18px] border border-[#D8C6B6] bg-white/95 px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)] lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B08A78]">OmniKuno</p>
            <h2 className="mt-1 text-2xl font-bold text-[#2C2C2C]">{String(t("antrenament.oc.cardTitle"))}</h2>
            <p className="mt-2 text-sm text-[#5A4B43]">{String(t("antrenament.oc.cardDescription"))}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/omni-kuno"
                className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#4F2C1F,#A55B3C)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FFF8F0] shadow-[0_12px_28px_rgba(79,44,31,0.22)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C07963]"
              >
                {String(t("antrenament.oc.missionCta"))}
              </Link>
              <Link
                href="/knowledge-exam"
                className="inline-flex items-center rounded-full border border-[#C07963] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C07963] transition hover:bg-[#FFF2EB]"
              >
                {String(t("antrenament.oc.quizCta"))}
              </Link>
            </div>
          </div>
        );
      case "ose": {
        type QuestItem = {
          id: string;
          scriptId: string;
          type: "learn" | "practice" | "reflect";
          title: string;
          body: string;
          ctaLabel: string;
          priority: number;
          contextSummary: string;
          completed?: boolean;
        };
        const questItems = (progress?.quests?.items ?? []) as QuestItem[];
        return (
          <>
            <div className="rounded-[16px] border border-[#D8C6B6] bg-white/95 px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
              <WizardSondajCBT userId={profile?.id ?? null} onContinue={() => { /* stay on tab */ }} />
            </div>
            <QuestsList
              lang={normalizedLang}
              categories={progress?.intent?.categories ?? []}
              items={questItems}
            />
          </>
        );
      }
      case "oa":
        return isMember ? (
          <div className="rounded-[16px] border border-[#D8C6B6] bg-white/95 px-8 py-8 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
            <OmniAbilitiesForm lang={normalizedLang} />
          </div>
        ) : (
          <LockedModuleCard
            title={lang === "ro" ? "Omni-Abilități" : "Omni-Abilities"}
            description={lang === "ro" ? "Activează contul de membru pentru a accesa probele practice." : "Activate your member account to access the practice probes."}
          />
        );
      case "oi":
        return (
          <>
            <div className="rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-8 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[1.5px]">
              <EvaluationWizard />
            </div>
            <EvaluationTrend />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <div className="mx-auto max-w-5xl px-6 pt-12">
        {/* OmniPathRow hidden per request */}
        <div
          className="mt-2 flex flex-wrap gap-3 rounded-[12px] border border-[#E4D8CE] bg-white/90 px-4 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.05)]"
          role="tablist"
          aria-label={lang === "ro" ? "Module antrenament" : "Training modules"}
        >
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.key;
            const isComingSoon = tab.status === "preview";
            return (
              <button
                key={tab.key}
                type="button"
                role={isComingSoon ? undefined : "tab"}
                aria-selected={!isComingSoon ? isActive : undefined}
                aria-disabled={isComingSoon || undefined}
                aria-hidden={isComingSoon || undefined}
                tabIndex={isComingSoon ? -1 : undefined}
                onClick={() => {
                  if (isComingSoon) return;
                  const params = new URLSearchParams(searchParams?.toString() ?? "");
                  params.set("tab", tab.key);
                  const qs = params.toString();
                  router.replace(qs ? `/antrenament?${qs}` : "/antrenament");
                  void recordEvaluationTabChange(tab.key);
                }}
                className={`flex flex-col rounded-[10px] border px-4 py-3 text-left transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                  isComingSoon
                    ? "cursor-default border-dashed border-[#F2E7DA] bg-white/70 text-[#A08F82] opacity-10 hover:opacity-45"
                    : isActive
                    ? "border-transparent bg-[linear-gradient(135deg,#4F2C1F,#A55B3C)] text-[#FFF8F0] shadow-[0_10px_30px_rgba(79,44,31,0.25)]"
                    : "border border-[#E4D8CE] bg-[#FCF7F1] text-[#5C4F45] hover:border-[#D8C6B6] hover:bg-white"
                }`}
              >
                <span className={`inline-flex items-center gap-1 text-sm font-semibold uppercase ${isActive ? "tracking-[0.2em]" : "tracking-[0.27em]"}`}>
                  {tab.label}
                  {isComingSoon ? (
                    <InfoTooltip
                      items={[lang === "ro" ? "În curând" : "Coming soon"]}
                      label={lang === "ro" ? "În curând" : "Coming soon"}
                    />
                  ) : null}
                </span>
                <span className="text-xs text-current">{tab.description}</span>
              </button>
            );
          })}
        </div>
        {/* Active tab helper: what you do here and why it matters */}
        <div className="mt-3 rounded-[10px] border border-[#E4D8CE] bg-[#FFFBF7] px-4 py-3 text-xs text-[#5C4F45]">
          <div className="flex items-start gap-2">
            <span>
              {s(`antrenamentTabHelp.${activeTab}`,
                normalizedLang === "ro"
                  ? "Aici clarifici ce te preocupă acum și de ce contează. Te ajută să formulezi direcția și motivația personală pentru pașii următori."
                  : "Clarify what concerns you now and why it matters. This focuses your direction and motivation for the next steps."
              )}
            </span>
            {tabWhatItems.length > 0 ? (
              <InfoTooltip
                items={tabWhatItems}
                label={normalizedLang === "ro" ? "Ce conține" : "What it contains"}
                className="mt-[2px]"
              />
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-8">{renderTabContent()}</div>
      </div>
    </div>
  );
}

function LockedModuleCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-[#E4D8CE] bg-white/90 px-6 py-8 text-center text-sm text-[#4A3A30] shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
      <h2 className="text-xl font-semibold text-[#2C2C2C]">{title}</h2>
      <p className="mt-2">{description}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.35em] text-[#C07963]">Disponibil doar membrilor programului</p>
    </div>
  );
}

export default function AntrenamentPage() {
  return (
    <Suspense fallback={null}>
      <AntrenamentContent />
    </Suspense>
  );
}
