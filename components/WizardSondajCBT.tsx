"use client";

import { useState } from "react";
import GuideCard from "./onboarding/GuideCard";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import { recordActivityEvent, recordCbtSurvey, recordOnboardingEvent, recordLessonHint } from "@/lib/progressFacts";
import { computeLessonHint } from "@/lib/lessonHints";

type CheckProps = { label: string; checked: boolean; onChange: (next: boolean) => void };
function CbtCheck({ label, checked, onChange }: CheckProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#2C2C2C]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[#CDBEAF] text-[#2C2C2C] focus:ring-0"
      />
      <span>{label}</span>
    </label>
  );
}

export default function WizardSondajCBT({ userId, onContinue }: { userId: string | null; onContinue: () => void }) {
  const { lang } = useI18n();
  // Basic CBT survey fields
  const [emotion, setEmotion] = useState<string>("");
  const [distortions, setDistortions] = useState<Record<string, boolean>>({
    catastrofare: false,
    alb_negru: false,
    citirea_gandurilor: false,
    personalizare: false,
    generalizare: false,
    filtru_negativ: false,
  });
  const [triggers, setTriggers] = useState<string>("");
  const [coping, setCoping] = useState<Record<string, boolean>>({
    evitare: false,
    confruntare: false,
    sprijin: false,
    restructurare: false,
    mindfulness: false,
  });
  const [beliefStrength, setBeliefStrength] = useState<number>(5);
  const [avoidanceLevel, setAvoidanceLevel] = useState<number>(5);
  const [readiness, setReadiness] = useState<number>(7);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const payload = {
        emotion,
        distortions: Object.keys(distortions).filter((k) => distortions[k]),
        triggers: triggers.trim(),
        coping: Object.keys(coping).filter((k) => coping[k]),
        beliefStrength,
        avoidanceLevel,
        readiness,
      };
      await recordCbtSurvey(payload, userId ?? undefined);
      const hint = computeLessonHint({ survey: payload });
      if (hint) await recordLessonHint(hint, userId ?? undefined);
      await recordOnboardingEvent({ step: 'cbtSurvey', selection: emotion || undefined }, userId ?? undefined);
      await recordActivityEvent({ startedAtMs: Date.now(), source: 'journal', category: 'reflection', units: 1 }, userId ?? undefined);
    } catch {}
    setBusy(false);
    onContinue();
  };

  const D = (key: string, ro: string, en: string) => (lang === 'ro' ? ro : en);

  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <TypewriterText text={D('t', 'Un scurt sondaj CBT ca să personalizăm pașii următori.', 'A short CBT survey to tailor your next steps.')} />
      </div>
      <GuideCard title={D('title', 'Sondaj rapid (2–3 minute)', 'Quick survey (2–3 minutes)')}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#2C2C2C]">{D('e', 'Emoția dominantă (recent)', 'Predominant emotion (recent)')}</p>
            <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="w-full rounded-[10px] border border-[#D8C6B6] px-3 py-2 text-sm text-[#2C2C2C] focus:border-[#E60012] focus:outline-none" data-testid="cbt-emotion">
              <option value="">{D('sel', 'Alege…', 'Choose…')}</option>
              {['anxietate','furie','tristețe','vinovăție','rușine','frustrare'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#2C2C2C]">{D('t2', 'Declanșatori frecvenți (scurt)', 'Common triggers (short)')}</p>
            <input value={triggers} onChange={(e) => setTriggers(e.target.value)} className="w-full rounded-[10px] border border-[#D8C6B6] px-3 py-2 text-sm text-[#2C2C2C] focus:border-[#E60012] focus:outline-none" placeholder={D('ph','ex. critici, termene, conflicte','e.g., criticism, deadlines, conflict')} data-testid="cbt-triggers" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#2C2C2C]">{D('d2', 'Tipare de gândire (bifează)', 'Thinking patterns (check)')}</p>
            <div className="grid gap-1">
              {([['catastrofare','d1'],['alb_negru','d3'],['citirea_gandurilor','d4'],['personalizare','d5'],['generalizare','d6'],['filtru_negativ','d7']] as const).map(([id, key]) => (
                <CbtCheck key={id} label={D(key, id, id)} checked={Boolean(distortions[id])} onChange={(next) => setDistortions((prev) => ({ ...prev, [id]: next }))} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#2C2C2C]">{D('c1', 'Stiluri de coping (bifează)', 'Coping styles (check)')}</p>
            <div className="grid gap-1">
              {([['evitare','c2'],['confruntare','c3'],['sprijin','c4'],['restructurare','c5'],['mindfulness','c6']] as const).map(([id, key]) => (
                <CbtCheck key={id} label={D(key, id, id)} checked={Boolean(coping[id])} onChange={(next) => setCoping((prev) => ({ ...prev, [id]: next }))} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#2C2C2C]">{D('b1', 'Cât de puternic crezi gândul (1–10)', 'Belief strength (1–10)')}</p>
            <input type="range" min={1} max={10} value={beliefStrength} onChange={(e) => setBeliefStrength(Number(e.target.value))} className="w-full" data-testid="cbt-belief" />
            <div className="text-xs text-[#7B6B60]">{beliefStrength}/10</div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#2C2C2C]">{D('b2', 'Nivel de evitare (1–10)', 'Avoidance level (1–10)')}</p>
            <input type="range" min={1} max={10} value={avoidanceLevel} onChange={(e) => setAvoidanceLevel(Number(e.target.value))} className="w-full" data-testid="cbt-avoid" />
            <div className="text-xs text-[#7B6B60]">{avoidanceLevel}/10</div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#2C2C2C]">{D('b3', 'Disponibil(ă) să încerci alternative (1–10)', 'Willingness to try alternatives (1–10)')}</p>
            <input type="range" min={1} max={10} value={readiness} onChange={(e) => setReadiness(Number(e.target.value))} className="w-full" data-testid="cbt-ready" />
            <div className="text-xs text-[#7B6B60]">{readiness}/10</div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]"
            data-testid="cbt-continue"
          >
            {D('btn','Continuă','Continue')}
          </button>
        </div>
      </GuideCard>
    </section>
  );
}
