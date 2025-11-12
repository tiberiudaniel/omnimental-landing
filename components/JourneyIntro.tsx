"use client";

import TypewriterText from "./TypewriterText";
import { useTStrings } from "./useTStrings";

interface JourneyIntroProps {
  onStart: () => void;
}

export default function JourneyIntro({ onStart }: JourneyIntroProps) {
  const { s, sa } = useTStrings();
  const title = s("journeyIntroTitle", "Antrenează-ți mintea. Începe mini-evaluarea ta.");
  const body = s("journeyIntroBody", "3–4 pași rapizi. La final primești o recomandare");
  const buttonLabel = s("journeyIntroButton", "Începe mini-evaluarea");
  const bullets = sa("journeyIntroBullets");
  const microcopy = s("journeyIntroMicrocopy", "Este simplu și durează doar 2 minute.");

  return (
    <section id="intro" className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="w-full max-w-3xl space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <TypewriterText key={title} text={title} speed={90} enableSound />
        {body ? <p className="text-base leading-relaxed text-[#2C2C2C]/80">{body}</p> : null}
        <ul className="space-y-3 text-center text-sm text-[#2C2C2C]">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-center justify-center gap-2">
              <span aria-hidden="true" className="text-[#E60012]">
                →
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#A08F82]">
            Mini-evaluare gratuită · 3–4 pași · ~2 minute
          </p>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex w-full items-center justify-center rounded-[12px] border border-[#2C2C2C] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[#E60012] sm:w-auto"
            style={{ background: "linear-gradient(135deg,#2C2C2C,#C24B17)" }}
          >
            {buttonLabel}
          </button>
          <p className="text-xs text-[#2C2C2C]/70">{microcopy}</p>
        </div>
      </div>
    </section>
  );
}
