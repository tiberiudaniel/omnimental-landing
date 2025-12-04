"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import { useI18n } from "@/components/I18nProvider";
import { OmniCard } from "@/components/OmniCard";
import { NeutralCtaButton } from "@/components/ui/cta/NeutralCtaButton";

export default function StepProjection({ onGoTraining }: { onGoTraining: () => void }) {
  const { lang } = useI18n();
  return (
    <section className="space-y-4">
      <OmniCard className="px-6 py-6">
        <div
          className="mb-1 text-xs uppercase tracking-[0.3em]"
          style={{ color: "var(--omni-muted)" }}
        >
          {lang === 'ro' ? 'Pas 7/7' : 'Step 7/7'}
        </div>
        <Typewriter text={lang === 'ro' ? "Proiecție: în câteva zile simți primele schimbări; în câteva săptămâni apar automatismele; în câteva luni ritmul devine natural." : "Projection: days — first change; weeks — new habits; months — natural cadence."} />
      </OmniCard>
      <div className="flex justify-end">
        <NeutralCtaButton onClick={onGoTraining} size="sm" className="text-[11px]">
          {lang === "ro" ? "Mergi la Antrenament" : "Go to Training"}
        </NeutralCtaButton>
      </div>
    </section>
  );
}
