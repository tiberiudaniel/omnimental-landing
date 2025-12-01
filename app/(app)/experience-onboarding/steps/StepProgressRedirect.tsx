"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import { useI18n } from "@/components/I18nProvider";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function StepProgressRedirect({ onRedirect }: { onRedirect: () => void }) {
  const { lang } = useI18n();
  const search = useSearchParams();
  const e2e = search?.get('e2e') === '1';
  useEffect(() => {
    if (e2e) {
      const id = setTimeout(() => onRedirect(), 250);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [e2e, onRedirect]);
  return (
    <section
      className="omni-card px-6 py-8 text-center"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
    >
      <div
        className="mb-1 text-xs uppercase tracking-[0.3em]"
        style={{ color: "var(--text-soft)" }}
      >
        {lang === 'ro' ? 'Pas 4/7' : 'Step 4/7'}
      </div>
      <Typewriter text={lang === 'ro' ? "Te ducem în dashboard ca să vezi cum se actualizează progresul." : "We’ll take you to your dashboard to see progress update."} />
      <div className="mt-4">
        <button
          onClick={onRedirect}
          className="omni-btn-ghost text-[11px] font-semibold uppercase tracking-[0.25em]"
        >
          {lang === 'ro' ? 'Continuă acum' : 'Continue now'}
        </button>
      </div>
    </section>
  );
}
