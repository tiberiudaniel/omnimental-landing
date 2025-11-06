"use client";

import React, { useState } from "react";
import FirstScreen from "../components/FirstScreen";
import CardOption from "../components/CardOption";
import SessionDetails from "../components/SessionDetails";
import TypewriterText from "../components/TypewriterText";
import { I18nProvider, useI18n } from "../components/I18nProvider";
import SocialProof from "../components/SocialProof";
import SiteHeader from "../components/SiteHeader";
import MenuOverlay from "../components/MenuOverlay";
import { useNavigationLinks } from "../components/useNavigationLinks";

function PageContent() {
  const { t } = useI18n();
  type Step = "first" | "cards" | "details";

  const [step, setStep] = useState<Step>("first");
  const [selectedCard, setSelectedCard] = useState<"individual" | "group" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const chooseOption = t("chooseOption");
  const chooseOptionText =
    typeof chooseOption === "string" ? chooseOption : "";

  const goToStep = (nextStep: Step) => {
    setStep(nextStep);
    if (nextStep === "first") {
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
  };

  return (
    <div className="bg-bgLight min-h-screen">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <main>
        {step === "first" && <FirstScreen onNext={() => goToStep("cards")} />}

        {step === "cards" && (
          <div className="flex min-h-screen flex-col items-center px-4 pt-12">
            <TypewriterText
              key={`choose-${chooseOptionText || "option"}`}
              text={chooseOptionText}
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
