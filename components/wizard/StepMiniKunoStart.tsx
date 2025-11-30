"use client";

import TypewriterText from '@/components/TypewriterText';
import GuideCard from '@/components/onboarding/GuideCard';
import { useI18n } from '@/components/I18nProvider';

export default function StepMiniKunoStart({ onContinue }: { onContinue: () => void }) {
  const { lang } = useI18n();
  const title = lang === 'ro'
    ? 'Începe mini‑Kuno: un test scurt pe tema ta'
    : 'Start the mini‑Kuno: a short test on your theme';
  const cta = lang === 'ro' ? 'Deschide mini‑Kuno' : 'Open mini‑Kuno';
  const done = lang === 'ro' ? 'Am finalizat mini‑Kuno' : 'I have completed mini‑Kuno';
  const desc = lang === 'ro'
    ? 'Completezi testul scurt Omni‑Kuno pentru a calibra recomandările. După ce termini, revino aici și apasă Continuă.'
    : 'Complete the short Omni‑Kuno test to calibrate recommendations. After you finish, come back here and press Continue.';
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-sm">
        <TypewriterText text={title} />
      </div>
      <GuideCard title={lang === 'ro' ? 'Pas obligatoriu' : 'Required step'}>
        <p className="text-sm text-[var(--omni-ink-soft)]">{desc}</p>
        <div className="mt-3 flex items-center justify-between">
          <a
            href="/experience-onboarding?flow=initiation&step=welcome&from=wizard"
            className="rounded-[10px] border border-[var(--omni-border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
            data-testid="need-minikuno-open"
          >
            {cta}
          </a>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-[10px] border border-[var(--omni-border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
            data-testid="need-minikuno-done"
          >
            {done}
          </button>
        </div>
      </GuideCard>
    </section>
  );
}
