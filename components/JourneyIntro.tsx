"use client";

import TypewriterText from "./TypewriterText";
import { useTStrings } from "./useTStrings";
import { useI18n } from "./I18nProvider";

interface JourneyIntroProps {
  onStart: () => void;
}

export default function JourneyIntro({ onStart }: JourneyIntroProps) {
  const { s } = useTStrings();
  const { lang } = useI18n();
  // New narrative intro (typewriter): 2–3 scurte fraze
  const narrative = s(
    "journeyIntroNarrative",
    lang === 'ro'
      ? "Trăim într-o perioadă în care mintea e bombardată constant: știri, presiune, decizii greu de amânat. Dacă nu o antrenezi, ea decide pentru tine – de obicei în favoarea fricii și oboselii, nu a clarității. Acest mic traseu te ajută să înțelegi rapid unde ești acum și ce tip de antrenament mental ți-ar folosi cel mai mult."
      : "We live in a time where the mind is constantly bombarded: news, pressure, decisions that can’t wait. If you don’t train it, it chooses for you — usually in favor of fear and fatigue, not clarity. This short path helps you quickly see where you are and what kind of mental training would help most.",
  ) as string;
  // optional title reserved for future use (removed to keep lint clean)
  const buttonLabel = s("journeyIntroButton", lang === 'ro' ? "Începe mini‑evaluarea" : "Start the mini‑assessment");
  // Single, succinct duration mention
  const microcopy = s("journeyIntroMicrocopy", lang === 'ro' ? "3–4 pași · ~2 minute" : "3–4 steps · ~2 minutes");

  return (
    <section id="intro" className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="w-full max-w-3xl space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <TypewriterText
          key={narrative}
          text={narrative}
          speed={88}
          enableSound
          wrapperClassName="typewriter-display mb-6 w-full bg-[#F6F2EE] px-6 py-5"
        />

        {/* Ce urmează */}
        <div className="mx-auto mt-2 max-w-xl text-left">
          <h2 className="mb-2 text-base font-semibold text-[#1F1F1F]">{s("journeyWhatsNext", lang === 'ro' ? "Ce urmează" : "What’s next") as string}</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-[#2C2C2C]">
            <li>{lang === 'ro' ? '• Alegi 5–7 intenții care te reprezintă acum.' : '• Pick 5–7 intents that fit you right now.'}</li>
            <li>{lang === 'ro' ? '• Răspunzi la câteva întrebări scurte despre ritm, resurse și obiective.' : '• Answer a few short questions about pace, resources, and goals.'}</li>
            <li>{lang === 'ro' ? '• Primești o recomandare clară (individual vs. grup) cu pași pentru următoarele 24h.' : '• Get a clear recommendation (individual vs. group) plus next 24h steps.'}</li>
          </ul>
        </div>

        {/* Garanții / Ce NU este */}
        <div className="mx-auto mt-3 max-w-xl text-left">
          <h3 className="mb-1 text-sm font-semibold text-[#1F1F1F]">{s("journeyWhatNot", lang === 'ro' ? "Ce NU este / Garanții" : "What it isn’t / Guarantees") as string}</h3>
          <p className="text-sm leading-relaxed text-[#2C2C2C]/80">
            {lang === 'ro'
              ? 'Nu e diagnostic medical și nu promite rezultate peste noapte. E o orientare practică, bazată pe datele tale, ca să începi cu claritate.'
              : 'It’s not a medical diagnosis, and it doesn’t promise overnight results. It’s a practical orientation, based on your data, to start with clarity.'}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#A08F82]">
            {microcopy}
          </p>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex w-full items-center justify-center rounded-[12px] border border-[#2C2C2C] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[#E60012] sm:w-auto"
            style={{ background: "linear-gradient(135deg,#2C2C2C,#C24B17)" }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
