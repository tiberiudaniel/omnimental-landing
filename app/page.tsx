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
import IntentCloud from "../components/IntentCloud";
import { useNavigationLinks } from "../components/useNavigationLinks";
import JourneyIntro from "../components/JourneyIntro";
import ReflectionScreen from "../components/ReflectionScreen";
import { getDb } from "../lib/firebase";

const db = getDb();

function PageContent() {
  const { t, lang } = useI18n();
  type Step =
    | "intro"
    | "firstInput"
    | "reflectionPrompt"
    | "intent"
    | "reflectionSummary"
    | "cards"
    | "details";

  const [step, setStep] = useState<Step>("intro");
  const [selectedCard, setSelectedCard] = useState<"individual" | "group" | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [intentTags, setIntentTags] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const chooseOption = t("chooseOption");
  const chooseOptionText =
    typeof chooseOption === "string" ? chooseOption : "";
  const cardsHeadlineValue = t("cardsHeadline");
  const cardsHeadline =
    typeof cardsHeadlineValue === "string" ? cardsHeadlineValue : chooseOptionText;
  const reflectionContinueValue = t("reflectionContinue");
  const reflectionContinue =
    typeof reflectionContinueValue === "string" ? reflectionContinueValue : "Continuă";
  const reflectionContinueIntroValue = t("reflectionContinueIntro");
  const reflectionContinueIntro =
    typeof reflectionContinueIntroValue === "string" ? reflectionContinueIntroValue : reflectionContinue;
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
    const tagsPreview = intentTags.slice(0, 3).join(", ") || "claritate";
    const introLine =
      typeof introValue === "string"
        ? introValue.replace("{{tags}}", tagsPreview)
        : `Pare că vrei să lucrezi la ${tagsPreview}.`;
    const bodyLine =
      typeof bodyValue === "string"
        ? bodyValue
        : "Există două moduri prin care poți continua.";
    return [introLine, bodyLine];
  }, [intentTags, t]);

  const reflectionTwoButton = reflectionContinue;

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

  const handleCardSelect = (type: "individual" | "group") => {
    setSelectedCard(type);
    goToStep("details");

    void addDoc(collection(db, "userJourneys"), {
      entry: journalEntry,
      tags: intentTags,
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

  const handleIntentComplete = (tags: string[]) => {
    setIntentTags(tags);
    goToStep("reflectionSummary");
  };

  return (
    <div className="bg-bgLight min-h-screen">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

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
            buttonLabel={reflectionContinueIntro}
            onContinue={() => goToStep("intent")}
          />
        )}

        {step === "intent" && (
          <IntentCloud minSelection={7} maxSelection={7} onComplete={handleIntentComplete} />
        )}

        {step === "reflectionSummary" && (
          <ReflectionScreen
            lines={reflectionTwoLines}
            buttonLabel={reflectionTwoButton}
            onContinue={() => goToStep("cards")}
          />
        )}

        {step === "cards" && (
          <div className="flex min-h-screen flex-col items-center px-4 pt-12">
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
