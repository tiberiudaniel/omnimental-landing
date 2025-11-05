// app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import FirstScreen from "../components/FirstScreen";
import CardOption from "../components/CardOption";
import SessionDetails from "../components/SessionDetails";
import TypewriterText from "../components/TypewriterText";
import { testFirebase } from "../lib/testFirebase";
import { I18nProvider, useI18n } from "../components/I18nProvider";

function PageContent() {
  const { lang, setLang, t } = useI18n();

  const [step, setStep] = useState<"first" | "cards" | "details">("first");
  const [selectedCard, setSelectedCard] = useState<"individual" | "group" | null>(null);

  useEffect(() => {
    // client-only Firebase test
    testFirebase().catch((e) => console.warn("testFirebase failed:", e));
  }, []);

  const handleCardSelect = (type: "individual" | "group") => {
    setSelectedCard(type);
    setStep("details");
  };

  return (
    <div className="bg-bgLight min-h-screen">
      <header className="flex justify-between items-center p-4 bg-white shadow">
        <Image src="/assets/logo.jpg" alt="Logo" width={120} height={40} />
        <button
          onClick={() => setLang(lang === "ro" ? "en" : "ro")}
          className="text-primary"
        >
          {lang.toUpperCase()}
        </button>
      </header>

      <main>
        {step === "first" && <FirstScreen onNext={() => setStep("cards")} />}

        {step === "cards" && (
          <div className="flex flex-col items-center min-h-screen px-4 pt-12">
            <TypewriterText text={t("chooseOption")} />

            <div className="flex flex-col md:flex-row w-full justify-center mt-8">
              {(["individual", "group"] as const).map((type) => (
                <CardOption
                  key={type}
                  title={t(type)}
                  onClick={() => handleCardSelect(type)}
                />
              ))}
            </div>
          </div>
        )}

        {step === "details" && selectedCard && (
          <SessionDetails type={selectedCard} i18nKey={selectedCard} />
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
