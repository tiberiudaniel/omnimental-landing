"use client";

import React, { useMemo, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import FirstScreen from "../components/FirstScreen";
import CardOption from "../components/CardOption";
import SessionDetails from "../components/SessionDetails";
import TypewriterText from "../components/TypewriterText";
import { I18nProvider, useI18n } from "../components/I18nProvider";
import SocialProof from "../components/SocialProof";
import SiteHeader from "../components/SiteHeader";
import MenuOverlay from "../components/MenuOverlay";
import IntentCloud, { type IntentCloudResult } from "../components/IntentCloud";
import { useNavigationLinks } from "../components/useNavigationLinks";
import JourneyIntro from "../components/JourneyIntro";
import ReflectionScreen from "../components/ReflectionScreen";
import IntentSummary from "../components/IntentSummary";
import { useProfile } from "../components/ProfileProvider";
import AccountModal from "../components/AccountModal";
import { getDb } from "../lib/firebase";

const db = getDb();
const REQUIRED_SELECTIONS = 7;

function PageContent() {
  const { t, lang } = useI18n();
  type Step =
    | "intro"
    | "firstInput"
    | "reflectionPrompt"
    | "intent"
    | "intentSummary"
    | "reflectionSummary"
    | "cards"
    | "details";

  const [step, setStep] = useState<Step>("intro");
  const [selectedCard, setSelectedCard] = useState<"individual" | "group" | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [intentTags, setIntentTags] = useState<string[]>([]);
  const [intentCategories, setIntentCategories] = useState<
    Array<{ category: string; count: number }>
  >([]);
  const [intentUrgency, setIntentUrgency] = useState(6);
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile } = useProfile();
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalKey, setAccountModalKey] = useState(0);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const chooseOption = t("chooseOption");
  const chooseOptionText =
    typeof chooseOption === "string" ? chooseOption : "";
  const cardsHeadlineValue = t("cardsHeadline");
  const cardsHeadline =
    typeof cardsHeadlineValue === "string" ? cardsHeadlineValue : chooseOptionText;
  const categoryLabels = useMemo(() => {
    const categoryLabelsValue = t("intentCategoryLabels");
    return categoryLabelsValue && typeof categoryLabelsValue === "object"
      ? (categoryLabelsValue as Record<string, string>)
      : {};
  }, [t]);
  const recommendedBadgeValue = t("cardsRecommendedLabel");
  const recommendedBadgeLabel =
    typeof recommendedBadgeValue === "string" ? recommendedBadgeValue : undefined;
  const reflectionOneLines = useMemo(() => {
    const line1 = t("reflectionOneLine1");
    const line2 = t("reflectionOneLine2");
    return [line1, line2]
      .map((line) => (typeof line === "string" ? line : ""))
      .filter((line) => line.length > 0);
  }, [t]);

  const reflectionTwoLines = useMemo(() => {
    const introValue = t("reflectionTwoIntro");
    const bodyValue = t("reflectionTwoBody");
    const tagsPreview =
      intentTags.slice(0, 3).join(", ") || (lang === "ro" ? "claritate" : "clarity");
    const connector = lang === "ro" ? " și " : " and ";
    const categorySummaryNames = intentCategories
      .filter((entry) => entry.count > 0)
      .slice(0, 2)
      .map((entry) => {
        const label = categoryLabels[entry.category];
        return typeof label === "string" && label.length > 0 ? label : entry.category;
      });
    const categorySummary =
      categorySummaryNames.length === 0
        ? tagsPreview
        : categorySummaryNames.length === 1
        ? categorySummaryNames[0]
        : `${categorySummaryNames[0]}${connector}${categorySummaryNames[1]}`;
    const introLine =
      typeof introValue === "string"
        ? introValue.replace("{{categorySummary}}", categorySummary)
        : `Pare că vrei să lucrezi la ${categorySummary}.`;
    const bodyLine =
      typeof bodyValue === "string"
        ? bodyValue
        : "Există două moduri prin care poți continua.";
    return [introLine, bodyLine];
  }, [intentCategories, intentTags, lang, categoryLabels, t]);

  const goToStep = (nextStep: Step) => {
    setStep(nextStep);
    if (nextStep === "intro") {
      setMenuOpen(false);
    }
  };

  const navLinks = useNavigationLinks();
  const getLabel = (key: string) => {
    const value = t(key);
    return typeof value === "string" ? value : key;
  };

  const persistIntentSnapshot = async (urgencyLevel: number, profileId: string | null) => {
    await addDoc(collection(db, "userIntentSnapshots"), {
      tags: intentTags,
      categories: intentCategories,
      urgency: urgencyLevel,
      profileId,
      lang,
      timestamp: serverTimestamp(),
    });
  };

  const handleCardSelect = (type: "individual" | "group") => {
    setSelectedCard(type);
    goToStep("details");

    void addDoc(collection(db, "userJourneys"), {
      entry: journalEntry,
      tags: intentTags,
      categorySummary: intentCategories,
      urgency: intentUrgency,
      profileId: profile?.id ?? null,
      choice: type,
      lang,
      timestamp: serverTimestamp(),
    }).catch((err) => {
      console.error("journey choice save failed", err);
    });
  };

  const handleFirstInputSubmit = async (text: string) => {
    setJournalEntry(text);
    try {
      await addDoc(collection(db, "userInterests"), {
        text,
        lang,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("journal entry save failed", err);
    }
  };

  const handleIntentComplete = (result: IntentCloudResult) => {
    setIntentTags(result.tags);
    setIntentCategories(result.categories);
    goToStep("intentSummary");
  };

  const finalizeIntentSummary = (urgency: number, profileId: string | null) => {
    goToStep("reflectionSummary");
    void persistIntentSnapshot(urgency, profileId).catch((err) => {
      console.error("intent summary save failed", err);
    });
  };

  const handleIntentSummaryComplete = (urgency: number) => {
    setIntentUrgency(urgency);
    finalizeIntentSummary(urgency, profile?.id ?? null);
    if (!profile) {
      setShowAccountPrompt(true);
    }
  };

  const openAccountModal = () => {
    setAccountModalKey((key) => key + 1);
    setAccountModalOpen(true);
  };

  const handleAccountDismiss = () => {
    setAccountModalOpen(false);
    setShowAccountPrompt(false);
  };

  const recommendedPath = useMemo<"individual" | "group">(() => {
    if (intentUrgency >= 7) {
      return "individual";
    }
    if (intentUrgency <= 4) {
      return "group";
    }
    const primary = intentCategories[0]?.category;
    if (
      primary === "relationships" ||
      primary === "selfTrust" ||
      primary === "boundaries"
    ) {
      return "individual";
    }
    return "group";
  }, [intentCategories, intentUrgency]);

  const recommendationCopyKey =
    recommendedPath === "individual"
      ? "cardsRecommendationIndividual"
      : "cardsRecommendationGroup";
  const recommendationCopy = t(recommendationCopyKey);
  const recommendationText =
    typeof recommendationCopy === "string" ? recommendationCopy : "";

  return (
    <div className="bg-bgLight min-h-screen">
      <SiteHeader
        showMenu
        onMenuToggle={() => setMenuOpen(true)}
        onAuthRequest={openAccountModal}
      />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      {accountModalOpen ? (
        <AccountModal
          key={accountModalKey}
          open={accountModalOpen}
          onClose={handleAccountDismiss}
        />
      ) : null}

      <main>
        {step === "intro" && <JourneyIntro onStart={() => goToStep("firstInput")} />}

        {step === "firstInput" && (
          <FirstScreen
            onSubmit={handleFirstInputSubmit}
            onNext={() => goToStep("reflectionPrompt")}
          />
        )}

        {step === "reflectionPrompt" && (
          <ReflectionScreen
            lines={reflectionOneLines}
            onContinue={() => goToStep("intent")}
          />
        )}

        {step === "intent" && (
          <IntentCloud
            minSelection={REQUIRED_SELECTIONS}
            maxSelection={REQUIRED_SELECTIONS}
            onComplete={handleIntentComplete}
          />
        )}

        {step === "intentSummary" && (
          <IntentSummary
            categories={intentCategories}
            maxSelection={REQUIRED_SELECTIONS}
            onContinue={handleIntentSummaryComplete}
          />
        )}

        {step === "reflectionSummary" && (
          <ReflectionScreen
            lines={reflectionTwoLines}
            onContinue={() => goToStep("cards")}
          />
        )}

        {step === "cards" && (
          <div className="flex min-h-screen flex-col items-center px-4 pt-12">
            {!profile && showAccountPrompt ? (
              <div className="mb-6 max-w-xl rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-3 text-center text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
                <p className="mb-3">
                  {typeof t("accountPromptMessage") === "string"
                    ? (t("accountPromptMessage") as string)
                    : "Salvează-ți progresul și vezi istoricul evaluărilor."}
                </p>
                <button
                  type="button"
                  onClick={openAccountModal}
                  className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                >
                  {typeof t("accountPromptButton") === "string"
                    ? (t("accountPromptButton") as string)
                    : "Creează cont"}
                </button>
              </div>
            ) : null}
            {recommendationText ? (
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#A08F82]">
                {recommendationText}
              </p>
            ) : null}
            <TypewriterText
              key={`choose-${cardsHeadline || "option"}`}
              text={cardsHeadline || chooseOptionText}
              speed={96}
              enableSound
            />

            <div className="mt-8 flex w-full max-w-4xl flex-col items-stretch justify-center gap-4 md:flex-row md:gap-6">
              {(["individual", "group"] as const).map((type) => (
                <CardOption
                  key={type}
                  type={type}
                  title={getLabel(type)}
                  onClick={() => handleCardSelect(type)}
                  isRecommended={recommendedPath === type}
                  recommendedLabel={recommendedBadgeLabel}
                />
              ))}
            </div>
          </div>
        )}

        {step === "details" && selectedCard && (
          <section className="px-4 pb-16 pt-12">
            <div className="mx-auto flex max-w-5xl flex-col gap-10" id="sessions">
              <SessionDetails type={selectedCard} />
              <SocialProof />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function PageWrapper() {
  return (
    <I18nProvider>
      <PageContent />
    </I18nProvider>
  );
}
