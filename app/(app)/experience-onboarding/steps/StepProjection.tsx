"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import { useI18n } from "@/components/I18nProvider";

export default function StepProjection({ onGoTraining }: { onGoTraining: () => void }) {
  const { lang } = useI18n();
  return (
    <section className="space-y-4">
      <div
        className="rounded-[16px] border px-6 py-6 shadow-sm"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <div
          className="mb-1 text-xs uppercase tracking-[0.3em]"
          style={{ color: "var(--text-soft)" }}
        >
          {lang === 'ro' ? 'Pas 7/7' : 'Step 7/7'}
        </div>
        <Typewriter text={lang === 'ro' ? "Proiecție: în câteva zile simți primele schimbări; în câteva săptămâni apar automatismele; în câteva luni ritmul devine natural." : "Projection: days — first change; weeks — new habits; months — natural cadence."} />
      </div>
      <div className="flex justify-end">
        <button
          onClick={onGoTraining}
          className="theme-btn-outline rounded-[10px] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em]"
        >
          {lang === 'ro' ? 'Mergi la Antrenament' : 'Go to Training'}
        </button>
      </div>
    </section>
  );
}
