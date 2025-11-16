"use client";

import TypewriterText from "./TypewriterText";
import { useTStrings } from "./useTStrings";

interface JourneyIntroProps {
  onStart: () => void;
}

export default function JourneyIntro({ onStart }: JourneyIntroProps) {
  const { s } = useTStrings();
  // New narrative intro (typewriter): 2–3 scurte fraze
  const narrative = s(
    "journeyIntroNarrative",
    "Trăim într-o perioadă în care mintea e bombardată constant: știri, presiune, decizii greu de amânat. Dacă nu o antrenezi, ea decide pentru tine – de obicei în favoarea fricii și oboselii, nu a clarității. Acest mic traseu te ajută să înțelegi rapid unde ești acum și ce tip de antrenament mental ți-ar folosi cel mai mult.",
  ) as string;
  // optional title reserved for future use (removed to keep lint clean)
  const buttonLabel = s("journeyIntroButton", "Începe mini‑evaluarea");
  // Single, succinct duration mention
  const microcopy = s("journeyIntroMicrocopy", "3–4 pași · ~2 minute");

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
          <h2 className="mb-2 text-base font-semibold text-[#1F1F1F]">{s("journeyWhatsNext", "Ce urmează") as string}</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-[#2C2C2C]">
            <li>• Alegi 5–7 intenții care te reprezintă acum.</li>
            <li>• Răspunzi la câteva întrebări scurte despre ritm, resurse și obiective.</li>
            <li>• Primești o recomandare clară (individual vs. grup) cu pași pentru următoarele 24h.</li>
          </ul>
        </div>

        {/* Garanții / Ce NU este */}
        <div className="mx-auto mt-3 max-w-xl text-left">
          <h3 className="mb-1 text-sm font-semibold text-[#1F1F1F]">{s("journeyWhatNot", "Ce NU este / Garanții") as string}</h3>
          <p className="text-sm leading-relaxed text-[#2C2C2C]/80">
            Nu e diagnostic medical și nu promite rezultate peste noapte. E o orientare practică, bazată pe datele tale, ca să începi cu claritate.
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
