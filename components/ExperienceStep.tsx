"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
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
      <Card className="border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-4">
        <h3 className="mb-2 text-base font-semibold text-[var(--omni-ink)]">
          {getString(t, "experience.title", lang === "ro" ? "Hai să vedem cum ar fi…" : "Let’s see how it could feel…")}
        </h3>
        <p className="mb-4 text-sm text-[var(--omni-ink-soft)]">
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
                  ? "border-[var(--omni-energy-soft)] bg-[var(--omni-energy-soft)] text-[var(--omni-bg-paper)]"
                  : "border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <OmniCtaButton
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={saving || selected.length === 0}
            className="min-w-[160px]"
          >
            {getString(t, "experience.continue", lang === "ro" ? "Continuă" : "Continue")}
          </OmniCtaButton>
        </div>
      </Card>
    </motion.section>
  );
}
