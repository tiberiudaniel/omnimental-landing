"use client";

import React, { useEffect, useMemo, useState } from "react";
import FirstScreen from "../components/FirstScreen";
import CardOption from "../components/CardOption";
import SessionDetails from "../components/SessionDetails";
import TypewriterText from "../components/TypewriterText";
import { I18nProvider, useI18n } from "../components/I18nProvider";
import AboutPreview from "../components/AboutPreview";
import SocialProof from "../components/SocialProof";
import SiteHeader from "../components/SiteHeader";
import MenuOverlay from "../components/MenuOverlay";

function PageContent() {
  const { t } = useI18n();
  const [step, setStep] = useState<"first" | "cards" | "details">("first");
  const [selectedCard, setSelectedCard] = useState<"individual" | "group" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const chooseOption = t("chooseOption");

  useEffect(() => {
    if (step === "first") {
      setMenuOpen(false);
    }
  }, [step]);

  const navLinks = useMemo(
    () => [
      { label: "Program", href: "/group-info", description: "Detalii Mental Coaching Group" },
      { label: "Evaluare", href: "/evaluation", description: "Completează scala de progres" },
      { label: "Despre mine", href: "/about", description: "Cine sunt și cum lucrez" },
      { label: "Contact", href: "mailto:hello@omnimental.ro", description: "Scrie-mi direct" },
    ],
    []
  );
  const getLabel = (key: string) => {
    const value = t(key);
    return typeof value === "string" ? value : key;
  };

  const handleCardSelect = (type: "individual" | "group") => {
    setSelectedCard(type);
    setStep("details");
  };

  return (
    <div className="bg-bgLight min-h-screen">
      <SiteHeader
        showMenu={step !== "first"}
        onMenuToggle={() => setMenuOpen(true)}
      />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <main>
        {step === "first" && <FirstScreen onNext={() => setStep("cards")} />}

        {step === "cards" && (
          <div className="flex flex-col items-center min-h-screen px-4 pt-12">
            <TypewriterText text={typeof chooseOption === "string" ? chooseOption : ""} />

            <div className="flex flex-col md:flex-row w-full justify-center mt-8">
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
          <div className="px-4 pb-16 pt-12">
            <SessionDetails type={selectedCard} />
            <AboutPreview />
            <SocialProof />
          </div>
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
