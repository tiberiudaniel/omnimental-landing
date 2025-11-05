// ./components/ClientPageContent.tsx
"use client";

import { useState } from "react";
import { useI18n } from "../hooks/useI18n";
import FirstScreen from "./FirstScreen";
import CardOption from "./CardOption";
import SessionDetails from "./SessionDetails";

export default function ClientPageContent() {
  const [step, setStep] = useState<"first" | "cards" | "details">("first");
  const [selectedCard, setSelectedCard] = useState<"individual" | "group" | null>(null);
  const { lang, setLang, t } = useI18n();

  return (
    <>
      {step === "first" && <FirstScreen onNext={() => setStep("cards")} />}
      {step === "cards" && (
        <CardOption
          selected={selectedCard}
          onSelect={setSelectedCard}
          onNext={() => setStep("details")}
        />
      )}
      {step === "details" && <SessionDetails selectedCard={selectedCard} />}
    </>
  );
}
