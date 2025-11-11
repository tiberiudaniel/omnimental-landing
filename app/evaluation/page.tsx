"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClientI18nWrapper from "../../components/ClientI18nWrapper";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import EvaluationForm from "../../components/EvaluationForm";
import { EvaluationTrend } from "../../components/EvaluationTrend";
import { useNavigationLinks } from "../../components/useNavigationLinks";
import { useProfile } from "../../components/ProfileProvider";
import { useI18n } from "../../components/I18nProvider";
import OmniAbilitiesForm from "../../components/OmniAbilitiesForm";
import OmniIntentForm from "../../components/OmniIntentForm";
import OmniKnowledgeQuiz from "../../components/OmniKnowledgeQuiz";
import { recordEvaluationTabChange } from "../../lib/progressFacts";

const TAB_ITEMS = [
  { key: "os", label: "Omni-Scop", description: "Scop & intenție" },
  { key: "oc", label: "Omni-Cuno", description: "Cunoaștere & concepte" },
  { key: "ose", label: "Omni-Sensei", description: "Mentorat & ghidaj" },
  { key: "oa", label: "Omni-Abil", description: "Abilități practice" },
  { key: "oi", label: "Omni-Intel", description: "Stare integrativă" },
] as const;

function LockedModuleCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-[#E4D8CE] bg-white/90 px-6 py-8 text-center text-sm text-[#4A3A30] shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
      <h2 className="text-xl font-semibold text-[#2C2C2C]">{title}</h2>
      <p className="mt-2">{description}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.35em] text-[#C07963]">
        Disponibil doar membrilor programului
      </p>
    </div>
  );
}

type TabKey = (typeof TAB_ITEMS)[number]["key"];

function EvaluationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();
  const { profile } = useProfile();
  const { lang } = useI18n();
  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";
  const allKeys = useMemo(() => TAB_ITEMS.map((t) => t.key), []);
  const activeTab = useMemo<TabKey>(() => {
    const q = searchParams?.get("tab");
    return (allKeys.includes(q as TabKey) ? (q as TabKey) : TAB_ITEMS[0].key) as TabKey;
  }, [allKeys, searchParams]);
  const accessTier = profile?.accessTier ?? "member"; // default to member access during development
  const isMember = Boolean(profile?.id) || accessTier !== "public";

  const renderTabContent = () => {
    switch (activeTab) {
      case "os":
        return isMember ? (
          <div className="rounded-[16px] border border-[#D8C6B6] bg-white/95 px-8 py-8 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
            <OmniIntentForm lang={normalizedLang} />
          </div>
        ) : (
          <LockedModuleCard
            title={lang === "ro" ? "Omni-Scop" : "Omni-Intent"}
            description={
              lang === "ro"
                ? "Disponibil doar membrilor programului."
                : "Available for members of the program."
            }
          />
        );
      case "oc":
        return (
          <div className="rounded-[16px] border border-[#D8C6B6] bg-white/95 px-8 py-8 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
            <OmniKnowledgeQuiz lang={normalizedLang} />
          </div>
        );
      case "ose":
        return (
          <LockedModuleCard
            title="Omni-Sensei"
            description="Modulul de mentorat ghidat este în curs de activare. Va deveni activ în versiunea următoare."
          />
        );
      case "oa":
        return isMember ? (
          <div className="rounded-[16px] border border-[#D8C6B6] bg-white/95 px-8 py-8 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
            <OmniAbilitiesForm lang={normalizedLang} />
          </div>
        ) : (
          <LockedModuleCard
            title={lang === "ro" ? "Omni-Abilități" : "Omni-Abilities"}
            description={
              lang === "ro"
                ? "Activează contul de membru pentru a accesa probele practice."
                : "Activate your member account to access the practice probes."
            }
          />
        );
      case "oi": {
        return (
          <>
            <div className="panel-canvas panel-canvas--hero panel-canvas--brain-right rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-10 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[1.5px]">
              <EvaluationForm
                mode="intelOnly"
                onSubmitted={() => {
                  const params = new URLSearchParams(searchParams?.toString() ?? "");
                  params.set("tab", "oc");
                  const qs = params.toString();
                  router.replace(qs ? `/evaluation?${qs}` : "/evaluation");
                }}
              />
            </div>
            <EvaluationTrend />
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <div className="mx-auto max-w-5xl px-6 pt-12">
        <div
          className="flex flex-wrap gap-3 rounded-[12px] border border-[#E4D8CE] bg-white/90 px-4 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.05)]"
          role="tablist"
          aria-label={lang === "ro" ? "Module evaluare" : "Evaluation modules"}
        >
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  const params = new URLSearchParams(searchParams?.toString() ?? "");
                  params.set("tab", tab.key);
                  const qs = params.toString();
                  router.replace(qs ? `/evaluation?${qs}` : "/evaluation");
                  void recordEvaluationTabChange(tab.key);
                }}
                className={`flex flex-col rounded-[10px] border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] ${
                  isActive
                    ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                    : "border-transparent text-[#4A3A30] hover:border-[#D8C6B6]"
                }`}
              >
                <span className="text-sm font-semibold uppercase tracking-[0.3em]">
                  {tab.label}
                </span>
                <span className="text-xs text-current">{tab.description}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 space-y-8">{renderTabContent()}</div>
      </div>
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <ClientI18nWrapper>
      <Suspense fallback={null}>
        <EvaluationContent />
      </Suspense>
    </ClientI18nWrapper>
  );
}
