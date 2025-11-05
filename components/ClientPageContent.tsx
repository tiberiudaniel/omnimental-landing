// ./components/ClientPageContent.tsx
"use client";

import { useState } from "react";
import FirstScreen from "./FirstScreen";
import CardOption from "./CardOption";
import SessionDetails from "./SessionDetails";
import { useI18n } from "./I18nProvider";

export default function ClientPageContent() {
  const [step, setStep] = useState<"first" | "cards" | "details">("first");
  const [selectedCard, setSelectedCard] = useState<"individual" | "group" | null>(null);
  const { t } = useI18n();

  const getLabel = (key: "individual" | "group") => {
    const value = t(key);
    return typeof value === "string" ? value : key;
  };

  const handleSelect = (type: "individual" | "group") => {
    setSelectedCard(type);
    setStep("details");
  };

  return (
    <>
      {step === "first" && <FirstScreen onNext={() => setStep("cards")} />}

      {step === "cards" && (
        <div className="flex flex-col items-center min-h-screen px-4 pt-12">
          <div className="flex flex-col md:flex-row w-full justify-center mt-8">
            {(["individual", "group"] as const).map((type) => (
              <CardOption
                key={type}
                type={type}
                title={getLabel(type)}
                onClick={() => handleSelect(type)}
              />
            ))}
          </div>
        </div>
      )}

      {step === "details" && selectedCard && <SessionDetails type={selectedCard} />}
    </>
  );
}
