"use client";

import React, { useState } from "react";
import Image from "next/image";
import FirstScreen from "../components/FirstScreen";
import CardOption from "../components/CardOption";
import SessionDetails from "../components/SessionDetails";
import TypewriterText from "../components/TypewriterText";
import { I18nProvider, useI18n } from "../components/I18nProvider";

function PageContent() {
  const { lang, setLang, t } = useI18n();
  const [step, setStep] = useState<"first" | "cards" | "details">("first");
  const [selectedCard, setSelectedCard] = useState<"individual" | "group" | null>(null);
  const chooseOption = t("chooseOption");
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
      <header className="flex items-center justify-between bg-white p-4 shadow">
        <div className="flex items-center gap-4">
          <Image src="/assets/logo.jpg" alt="OmniMental logo" width={80} height={32} priority />
          <span className="text-2xl font-semibold tracking-wide text-neutral-dark">
            OmniMental
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 p-1 text-xs font-semibold text-neutral-dark">
          {(["ro", "en"] as const).map((locale) => (
            <button
              key={locale}
              onClick={() => setLang(locale)}
              className={`rounded-full px-3 py-1.5 transition ${
                lang === locale ? "bg-white text-primary shadow-sm" : "text-primary/70 hover:text-primary"
              }`}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

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
          <SessionDetails type={selectedCard} />
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
