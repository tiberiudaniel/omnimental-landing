"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";

const INSIGHTS = [
  "claritate despre ce contează cu adevărat",
  "o emoție calmă și stabilă",
  "motivație reînnoită",
  "o idee care mi-a schimbat perspectiva",
  "sentiment de apartenență",
  "un exercițiu practic de care vreau să-mi amintesc",
  "feedback valoros de la ceilalți",
];

export default function ExperienceStep({
  userId,
  onContinue,
}: {
  userId: string;
  onContinue: () => void;
}) {
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await setDoc(
        doc(getDb(), "userProfiles", userId),
        { simulatedInsights: selected, simulatedInsightsUpdatedAt: serverTimestamp() },
        { merge: true },
      );
      onContinue();
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto mt-6 w-full max-w-3xl px-4"
    >
      <Card className="rounded-2xl border border-[#E4DAD1] bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-base font-semibold text-[#1F1F1F]">
          {getString(t, "experience.title", lang === "ro" ? "Hai să vedem cum ar fi…" : "Let’s see how it could feel…")}
        </h3>
        <p className="mb-4 text-sm text-[#4A3A30]">
          {getString(t, "experience.body", lang === "ro" ? "Imaginează-ți că tocmai ai participat la o sesiune. Ce crezi că ai primit din acea experiență?" : "Imagine you just had a session. What do you feel you received from that experience?")}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {INSIGHTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={`rounded-full border px-3 py-1 text-[12px] ${
                selected.includes(item)
                  ? "border-[#2C2C2C] bg-[#2C2C2C] text-white"
                  : "border-[#E4DAD1] bg-[#FFFBF7] text-[#2C2C2C] hover:border-[#2C2C2C]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || selected.length === 0}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {getString(t, "experience.continue", lang === "ro" ? "Continuă" : "Continue")}
          </button>
        </div>
      </Card>
    </motion.section>
  );
}
